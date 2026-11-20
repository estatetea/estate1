import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAdmin } from '@/lib/admin-auth';
import { teamMembers, hashPin, phoneLast10, cleanEmail } from '@/lib/team-auth';
import { getDb } from '@/lib/mongodb';

// Owner only: the team app's members (name, phone and/or email, their own PIN), switching them off, and what they changed.
const view = m => ({ member_id: m.member_id, name: m.name, phone: m.phone_last10 ? `+91 ${m.phone_last10.slice(0, 5)} ${m.phone_last10.slice(5)}` : '', email: m.email || '',
  active: m.active !== false, last_login_at: m.last_login_at || null, created_at: m.created_at || null });

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const members = await (await teamMembers()).find({ deleted: { $ne: true } }).sort({ created_at: 1 }).toArray();
    const activity = await (await getDb()).collection('team_activity').find({}).sort({ at: -1 }).limit(40).toArray();
    return NextResponse.json({ members: members.map(view), activity: activity.map(a => ({ name: a.name, method: a.method, path: a.path, at: a.at })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: "Couldn't load the team" }, { status: 500 }); }
}

// { action: 'add', name, phone?, email?, pin } | { action: 'update', member_id, name?, phone?, email?, pin? } |
// { action: 'active', member_id, active } | { action: 'remove', member_id }
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const col = await teamMembers();
  const name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const phone = b.phone !== undefined ? phoneLast10(b.phone) : undefined;
  const email = b.email !== undefined ? cleanEmail(b.email) : undefined;
  if (b.phone && !phone) return NextResponse.json({ error: 'Enter a 10-digit phone number' }, { status: 400 });
  if (b.email && !email) return NextResponse.json({ error: "That email doesn't look right" }, { status: 400 });
  if (b.pin !== undefined && b.pin !== '' && !/^\d{6}$/.test(String(b.pin))) return NextResponse.json({ error: 'The PIN must be 6 digits' }, { status: 400 });
  const clash = async (field, value, except) => value && await col.findOne({ [field]: value, deleted: { $ne: true }, ...(except ? { member_id: { $ne: except } } : {}) });
  try {
    if (b.action === 'add') {
      if (name.length < 2) return NextResponse.json({ error: 'Enter their name' }, { status: 400 });
      if (!phone && !email) return NextResponse.json({ error: 'Add their phone number or email (they sign in with it)' }, { status: 400 });
      if (!/^\d{6}$/.test(String(b.pin || ''))) return NextResponse.json({ error: 'Set a 6-digit PIN for them' }, { status: 400 });
      if (await clash('phone_last10', phone) || await clash('email', email)) return NextResponse.json({ error: 'Someone in the team already uses that phone or email' }, { status: 409 });
      const { salt, hash } = hashPin(b.pin);
      const doc = { member_id: 'TM-' + crypto.randomBytes(4).toString('hex').toUpperCase(), name, phone_last10: phone || '', email: email || '', pin_salt: salt, pin_hash: hash,
        active: true, session_version: 1, failed_attempts: 0, created_at: new Date() };
      await col.insertOne(doc);
      return NextResponse.json(view(doc));
    }
    const m = await col.findOne({ member_id: String(b.member_id || ''), deleted: { $ne: true } });
    if (!m) return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    let set = {};
    if (b.action === 'update') {
      if (name) set.name = name;
      if (phone !== undefined) { if (await clash('phone_last10', phone, m.member_id)) return NextResponse.json({ error: 'Someone else already uses that phone' }, { status: 409 }); set.phone_last10 = phone || ''; }
      if (email !== undefined) { if (await clash('email', email, m.member_id)) return NextResponse.json({ error: 'Someone else already uses that email' }, { status: 409 }); set.email = email || ''; }
      if (b.pin) { const { salt, hash } = hashPin(b.pin); set = { ...set, pin_salt: salt, pin_hash: hash, session_version: (m.session_version || 1) + 1, failed_attempts: 0, locked_until: 0 }; }
      const after = { ...m, ...set };
      if (!after.phone_last10 && !after.email) return NextResponse.json({ error: 'Keep a phone number or email, so they can sign in' }, { status: 400 });
    } else if (b.action === 'active') {
      set = { active: b.active !== false, session_version: (m.session_version || 1) + 1 };   // switching off signs them out at once
    } else if (b.action === 'remove') {
      set = { deleted: true, active: false, session_version: (m.session_version || 1) + 1, deleted_at: new Date() };
    } else return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    await col.updateOne({ _id: m._id }, { $set: set });
    return NextResponse.json(view({ ...m, ...set }));
  } catch { return NextResponse.json({ error: "Couldn't save that" }, { status: 500 }); }
}

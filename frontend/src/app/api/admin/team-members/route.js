import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAdmin } from '@/lib/admin-auth';
import { teamMembers, phoneLast10, cleanEmail, createLink, emailLink } from '@/lib/team-auth';
import { getDb } from '@/lib/mongodb';

// Owner only: the team app's members. Adding someone emails them a one-time link; they choose their own PIN on their phone.
const view = m => ({ member_id: m.member_id, name: m.name, email: m.email || '', phone: m.phone_last10 ? `+91 ${m.phone_last10.slice(0, 5)} ${m.phone_last10.slice(5)}` : '',
  active: m.active !== false, has_pin: !!m.pin_hash, phones: (m.devices || []).length, link_pending: !!(m.link && m.link.exp > Date.now()),
  last_login_at: m.last_login_at || null, created_at: m.created_at || null });

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const members = await (await teamMembers()).find({ deleted: { $ne: true } }).sort({ created_at: 1 }).toArray();
    const activity = await (await getDb()).collection('team_activity').find({}).sort({ at: -1 }).limit(40).toArray();
    return NextResponse.json({ members: members.map(view), activity: activity.map(a => ({ name: a.name, method: a.method, path: a.path, at: a.at })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: "Couldn't load the team" }, { status: 500 }); }
}

// { action: 'add', name, email, phone? } | { action: 'update', member_id, name?, email?, phone? } | { action: 'send_link', member_id }
// | { action: 'reset_pin', member_id } | { action: 'signout_phones', member_id } | { action: 'active', member_id, active } | { action: 'remove', member_id }
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const origin = new URL(request.url).origin;
  const col = await teamMembers();
  const name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const email = b.email !== undefined ? cleanEmail(b.email) : undefined;
  const phone = b.phone !== undefined ? phoneLast10(b.phone) : undefined;
  if (b.email && !email) return NextResponse.json({ error: "That email doesn't look right" }, { status: 400 });
  if (b.phone && !phone) return NextResponse.json({ error: 'Enter a 10-digit phone number' }, { status: 400 });
  const taken = async (value, except) => value && await col.findOne({ email: value, deleted: { $ne: true }, ...(except ? { member_id: { $ne: except } } : {}) });
  const sendLink = async (m, kind) => { const token = await createLink(m, kind); return emailLink(m, token, origin, kind); };
  try {
    if (b.action === 'add') {
      if (name.length < 2) return NextResponse.json({ error: 'Enter their name' }, { status: 400 });
      if (!email) return NextResponse.json({ error: 'Add their email: their sign-up link goes there' }, { status: 400 });
      if (await taken(email)) return NextResponse.json({ error: 'Someone in the team already uses that email' }, { status: 409 });
      const doc = { member_id: 'TM-' + crypto.randomBytes(4).toString('hex').toUpperCase(), name, email, phone_last10: phone || '', active: true,
        session_version: 1, devices: [], created_at: new Date() };
      await col.insertOne(doc);
      const sent = await sendLink(doc, 'invite');
      return NextResponse.json({ ...view(doc), link: sent.link, emailed: sent.sent });
    }
    const m = await col.findOne({ member_id: String(b.member_id || ''), deleted: { $ne: true } });
    if (!m) return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    const bump = { session_version: (m.session_version || 1) + 1 };
    if (b.action === 'update') {
      const set = {};
      if (name) set.name = name;
      if (email !== undefined) { if (!email) return NextResponse.json({ error: 'Keep an email for their links' }, { status: 400 }); if (await taken(email, m.member_id)) return NextResponse.json({ error: 'Someone else already uses that email' }, { status: 409 }); set.email = email; }
      if (phone !== undefined) set.phone_last10 = phone || '';
      await col.updateOne({ _id: m._id }, { $set: set });
      return NextResponse.json(view({ ...m, ...set }));
    }
    if (b.action === 'send_link') {
      const sent = await sendLink(m, m.pin_hash ? 'device' : 'invite');
      return NextResponse.json({ ...view(m), link: sent.link, emailed: sent.sent });
    }
    if (b.action === 'reset_pin') {   // they choose a new PIN from a fresh link; signed out everywhere until then
      await col.updateOne({ _id: m._id }, { $set: { ...bump, pin_hash: null, pin_salt: null } });
      const after = { ...m, ...bump, pin_hash: null };
      const sent = await sendLink(after, 'invite');
      return NextResponse.json({ ...view(after), link: sent.link, emailed: sent.sent });
    }
    let set;
    if (b.action === 'signout_phones') set = { ...bump, devices: [] };
    else if (b.action === 'active') set = { ...bump, active: b.active !== false };
    else if (b.action === 'remove') set = { ...bump, deleted: true, active: false, devices: [], link: null, deleted_at: new Date() };
    else return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    await col.updateOne({ _id: m._id }, { $set: set });
    return NextResponse.json(view({ ...m, ...set }));
  } catch { return NextResponse.json({ error: "Couldn't save that" }, { status: 500 }); }
}

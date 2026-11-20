import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

// The team app (the owner's three teammates, 20 Nov): each person signs in with their phone number or email and their own
// 6-digit PIN, which the owner sets. A team session is signed like the owner's but can only ever reach the routes that
// call verifyStaff (deliveries, sales, inventory, purchases, invoices, reports, invoice emails). WhatsApp, Brew, Aegis,
// approvals and settings stay owner-only, because those routes still call verifyAdmin.
const TEAM_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function phoneLast10(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '';
}
export function cleanEmail(raw) {
  const e = String(raw || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

export function hashPin(pin, salt = crypto.randomBytes(16).toString('base64url')) {
  const hash = crypto.scryptSync(String(pin), salt, 32).toString('base64url');
  return { salt, hash };
}
function pinMatches(pin, member) {
  if (!member?.pin_salt || !member?.pin_hash) return false;
  const { hash } = hashPin(pin, member.pin_salt);
  const a = Buffer.from(hash), b = Buffer.from(member.pin_hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function teamMembers() {
  return (await getDb()).collection('team_members');
}

// Sign in: phone or email + PIN. A wrong PIN counts against that person (5 tries, then 15 minutes locked).
export async function teamLogin(identifier, pin) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return { error: 'Sign-in is not configured', status: 503 };
  if (!/^\d{6}$/.test(String(pin || ''))) return { error: 'Enter your six-digit PIN', status: 400 };
  const email = cleanEmail(identifier), phone = email ? '' : phoneLast10(identifier);
  if (!email && !phone) return { error: 'Enter your phone number or email', status: 400 };
  const col = await teamMembers();
  const m = await col.findOne(email ? { email } : { phone_last10: phone });
  if (!m || m.active === false) return { error: 'That phone number or PIN is not right.', status: 401 };
  if (m.locked_until && m.locked_until > Date.now()) {
    return { error: 'Too many wrong PINs. Try again in a few minutes, or ask the owner to reset your PIN.', status: 429 };
  }
  if (!pinMatches(pin, m)) {
    const fails = (m.failed_attempts || 0) + 1;
    await col.updateOne({ _id: m._id }, { $set: fails >= MAX_FAILS ? { failed_attempts: 0, locked_until: Date.now() + LOCK_MS } : { failed_attempts: fails } });
    return { error: fails >= MAX_FAILS ? 'Too many wrong PINs. Try again in 15 minutes.' : `That PIN is not right. ${MAX_FAILS - fails} tries left.`, status: 401 };
  }
  await col.updateOne({ _id: m._id }, { $set: { failed_attempts: 0, locked_until: 0, last_login_at: new Date() } });
  const payload = Buffer.from(JSON.stringify({ mid: m.member_id, v: m.session_version || 1, exp: Date.now() + TEAM_TTL_MS })).toString('base64url');
  return { token: `team.${payload}.${sign(`estate-tea-team.${payload}`, secret)}`, member: { name: m.name, member_id: m.member_id } };
}

// The team member behind this request (null if none, switched off, PIN reset since, or expired).
export async function verifyTeam(request) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer team.') ? auth.slice(12) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(`estate-tea-team.${payload}`, secret);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!Number.isFinite(data.exp) || data.exp < Date.now() || !data.mid) return null;
  const m = await (await teamMembers()).findOne({ member_id: data.mid });
  if (!m || m.active === false || (m.session_version || 1) !== data.v) return null;
  return { member_id: m.member_id, name: m.name };
}

// The owner, or a signed-in team member (whose changes are recorded with their name). Use on team-allowed routes only.
export async function verifyStaff(request) {
  if (verifyAdmin(request)) return { owner: true, name: 'Owner' };
  const member = await verifyTeam(request);
  if (!member) return null;
  if (request.method && request.method !== 'GET') {
    try {
      const path = new URL(request.url).pathname;
      await (await getDb()).collection('team_activity').insertOne({ member_id: member.member_id, name: member.name, method: request.method, path, at: new Date() });
    } catch { /* the log never blocks the work */ }
  }
  return member;
}

import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

// The team app (the owner's teammates). How signing in works (the owner, 20 Nov: "just a PIN, specific to each person"):
//   1. The owner adds a person (name + email). They get an email with a one-time link.
//   2. They open it on their phone and choose their own 6-digit PIN. That phone is now a registered team phone.
//   3. From then on they just type their PIN: the PIN says who they are (Jakin's PIN opens Jakin's account).
// A PIN only works on a registered team phone, so nobody can sit and guess PINs from anywhere else. A new phone needs a
// fresh link (to their email). A team session reaches only the routes that call verifyStaff (deliveries, sales,
// inventory, purchases, invoices, reports, invoice emails); WhatsApp, Brew, Aegis, approvals and settings stay owner-only.
const TEAM_TTL_MS = 12 * 60 * 60 * 1000;
const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

const sign = (value, secret) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
const sha = v => crypto.createHash('sha256').update(String(v)).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y); };

export function phoneLast10(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '';
}
export function cleanEmail(raw) {
  const e = String(raw || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}
export function hashPin(pin, salt = crypto.randomBytes(16).toString('base64url')) {
  return { salt, hash: crypto.scryptSync(String(pin), salt, 32).toString('base64url') };
}
const pinMatches = (pin, m) => !!(m?.pin_salt && m?.pin_hash) && same(hashPin(pin, m.pin_salt).hash, m.pin_hash);

// Too easy to guess: one digit repeated, or a straight run (123456, 987654).
export function weakPin(pin) {
  const p = String(pin);
  if (/^(\d)\1{5}$/.test(p)) return true;
  const steps = [...p].slice(1).map((c, i) => Number(c) - Number(p[i]));
  return steps.every(s => s === 1) || steps.every(s => s === -1);
}

export async function teamMembers() {
  return (await getDb()).collection('team_members');
}

// ---- the one-time link (first phone, or a new phone) -------------------------------------------------------------
// Each link also has a short code (e.g. K7QM-2XPA) for typing into the app on the home screen: on an iPhone the
// home-screen app doesn't share Safari's storage, so a link opened in Safari doesn't register the app itself.
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const cleanCode = raw => String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export async function createLink(member, kind = 'invite') {
  const token = crypto.randomBytes(24).toString('base64url');
  const code = Array.from(crypto.randomBytes(8), b => CODE_ABC[b % CODE_ABC.length]).join('');
  await (await teamMembers()).updateOne({ member_id: member.member_id }, { $set: { link: { hash: sha(token), code_hash: sha('code:' + code), exp: Date.now() + LINK_TTL_MS, kind } } });
  return { token, code: `${code.slice(0, 4)}-${code.slice(4)}` };
}

async function memberForLink(token) {
  const code = cleanCode(token);
  const isCode = code.length === 8 && [...code].every(c => CODE_ABC.includes(c));
  if (!isCode && !/^[A-Za-z0-9_-]{20,80}$/.test(String(token || ''))) return null;
  const m = await (await teamMembers()).findOne(isCode ? { 'link.code_hash': sha('code:' + code) } : { 'link.hash': sha(token) });
  if (!m || m.active === false || m.deleted || !m.link || m.link.exp < Date.now()) return null;
  return m;
}

// What the link page shows: their first name, and whether they still need to choose a PIN.
export async function linkInfo(token) {
  const m = await memberForLink(token);
  return m ? { name: m.name, needs_pin: !m.pin_hash } : null;
}

function newSession(m, secret) {
  const payload = Buffer.from(JSON.stringify({ mid: m.member_id, v: m.session_version || 1, exp: Date.now() + TEAM_TTL_MS })).toString('base64url');
  return `team.${payload}.${sign(`estate-tea-team.${payload}`, secret)}`;
}

// Open the link on a phone: choose the PIN (first time, or after the owner reset it), and this phone is registered.
export async function acceptLink(token, pin) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return { error: 'Sign-in is not configured', status: 503 };
  const m = await memberForLink(token);
  if (!m) return { error: 'This link has expired or was already used. Ask the owner for a new one.', status: 410 };
  const col = await teamMembers();
  const set = {};
  if (!m.pin_hash) {
    if (!/^\d{6}$/.test(String(pin || ''))) return { error: 'Choose a six-digit PIN', status: 400 };
    if (weakPin(pin)) return { error: 'That PIN is too easy to guess. Please choose another.', status: 400 };
    // Each PIN belongs to one person only (it's how the app knows who's signing in).
    const others = await col.find({ deleted: { $ne: true } }).toArray();
    if (others.some(o => o.member_id !== m.member_id && pinMatches(pin, o))) return { error: "That PIN can't be used. Please choose a different one.", status: 409 };
    const { salt, hash } = hashPin(pin);
    Object.assign(set, { pin_salt: salt, pin_hash: hash });
  } else if (pin && !pinMatches(pin, m)) {
    return { error: "That's not your PIN.", status: 401 };
  }
  const deviceId = 'D-' + crypto.randomBytes(6).toString('hex'), deviceSecret = crypto.randomBytes(24).toString('base64url');
  const devices = [...(m.devices || []), { device_id: deviceId, secret_hash: sha(deviceSecret), added_at: new Date(), last_used_at: new Date() }].slice(-5);
  Object.assign(set, { devices, link: null, last_login_at: new Date() });
  await col.updateOne({ member_id: m.member_id }, { $set: set });
  return { device: `dev.${deviceId}.${deviceSecret}`, token: newSession({ ...m, ...set }, secret), member: { name: m.name, member_id: m.member_id } };
}

async function deviceFor(deviceToken) {
  const [tag, id, secret] = String(deviceToken || '').split('.');
  if (tag !== 'dev' || !id || !secret) return null;
  const owner = await (await teamMembers()).findOne({ 'devices.device_id': id });
  const d = owner && owner.active !== false && !owner.deleted && (owner.devices || []).find(x => x.device_id === id);
  return d && same(d.secret_hash, sha(secret)) ? { owner, device: d } : null;
}

// Sign in on a registered phone with just a PIN: whoever's PIN it is gets their own account.
export async function teamLogin(deviceToken, pin) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return { error: 'Sign-in is not configured', status: 503 };
  const reg = await deviceFor(deviceToken);
  if (!reg) return { error: 'This phone isn\'t registered for the team app yet. Use the link in your email, or tap "New phone? Get a link".', status: 403, unregistered: true };
  const col = await teamMembers();
  const { owner, device } = reg;
  if (device.locked_until && device.locked_until > Date.now()) return { error: 'Too many wrong PINs on this phone. Try again in a few minutes.', status: 429 };
  if (!/^\d{6}$/.test(String(pin || ''))) return { error: 'Enter your six-digit PIN', status: 400 };
  const members = await col.find({ deleted: { $ne: true } }).toArray();
  const m = members.find(x => x.active !== false && pinMatches(pin, x));
  const devices = (owner.devices || []).map(d => d.device_id !== device.device_id ? d : m
    ? { ...d, fails: 0, locked_until: 0, last_used_at: new Date() }
    : { ...d, fails: (d.fails || 0) + 1 >= MAX_FAILS ? 0 : (d.fails || 0) + 1, locked_until: (d.fails || 0) + 1 >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
  await col.updateOne({ member_id: owner.member_id }, { $set: { devices } });
  if (!m) {
    const left = MAX_FAILS - ((device.fails || 0) + 1);
    return { error: left > 0 ? `That PIN isn't right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong PINs. Try again in 15 minutes.', status: 401 };
  }
  await col.updateOne({ member_id: m.member_id }, { $set: { last_login_at: new Date() } });
  return { token: newSession(m, secret), member: { name: m.name, member_id: m.member_id } };
}

// ---- sessions -----------------------------------------------------------------------------------------------------
export async function verifyTeam(request) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer team.') ? auth.slice(12) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !same(sign(`estate-tea-team.${payload}`, secret), sig)) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!Number.isFinite(data.exp) || data.exp < Date.now() || !data.mid) return null;
  const m = await (await teamMembers()).findOne({ member_id: data.mid });
  if (!m || m.active === false || m.deleted || (m.session_version || 1) !== data.v) return null;
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

// Email someone their link (through Brew, which sends Estate Tea's emails).
export async function emailLink(member, { token, code }, origin, kind = 'invite') {
  const base = /^https:\/\/(www\.)?estatetea\.in$/.test(origin) ? origin : 'https://estatetea.in';
  const link = `${base}/team?${kind === 'device' ? 'device' : 'invite'}=${token}`;
  const brewUrl = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
  try {
    const r = await fetch(`${brewUrl}/brew/team-invite-email`, { method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-service-key': process.env.INTERNAL_SERVICE_KEY || '' },
      body: JSON.stringify({ to: member.email, name: member.name, link, code, kind }) });
    const b = await r.json().catch(() => ({}));
    return { link, code, sent: !!(r.ok && b.sent) };
  } catch { return { link, code, sent: false }; }
}

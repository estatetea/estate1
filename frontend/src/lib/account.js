// Website accounts are Brew's customer records: one per WhatsApp number. Signing in proves the number is theirs
// (they send a one-time code to us from their own WhatsApp), so their details come from what Brew already knows.
export const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
export const WHATSAPP_NUMBER = '919742668951';
export const SESSION_COOKIE = 'et_session';
export const LOGIN_COOKIE = 'et_login';
const KEY = () => process.env.INTERNAL_SERVICE_KEY || '';

export async function brew(path, body) {
  const r = await fetch(`${BREW_URL}${path}`, { method: 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'x-internal-service-key': KEY() }, body: JSON.stringify(body || {}) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

export const cookieOptions = maxAge => ({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge });

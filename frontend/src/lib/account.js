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

// The boss signed in on the website with his own WhatsApp number (Brew knows the owner numbers): the owner's view,
// e.g. the hidden collection before it's public. Checked on the server from the httpOnly session cookie, never trusted from the browser.
export async function ownerFromSession(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value || '';
  if (!token) return false;
  try { const r = await brew('/brew/website-account', { token }); return !!(r.ok && r.data?.profile?.is_owner); } catch { return false; }
}

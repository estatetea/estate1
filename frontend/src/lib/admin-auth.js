import crypto from 'crypto';

// Owner sessions expire so a leaked token stops working on its own.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}

// Token format: <base64url {exp,nonce}>.<hmac>. Signed with ADMIN_PASSWORD, so
// rotating the password also revokes every outstanding owner session.
export function issueAdminToken() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: crypto.randomBytes(12).toString('base64url'),
  })).toString('base64url');
  return `${payload}.${sign(`estate-tea-admin.${payload}`, secret)}`;
}

export function verifyAdmin(request) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(`estate-tea-admin.${payload}`, secret))) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(exp) && exp > Date.now();
  } catch {
    return false;
  }
}

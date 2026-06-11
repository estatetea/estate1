import crypto from 'crypto';

export function verifyAdmin(request) {
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) return false;
  
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  
  // Verify against deterministic hash
  const expected = crypto.createHmac('sha256', adminPass).update('estate-tea-admin').digest('hex');
  return token === expected;
}

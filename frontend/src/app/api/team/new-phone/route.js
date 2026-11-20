import { NextResponse } from 'next/server';
import { teamMembers, cleanEmail, createLink, emailLink } from '@/lib/team-auth';
import { clientKey, createLimiter } from '@/lib/rate-limit';

// "New phone? Get a link": emails a team member a link that registers this phone. Same answer whether or not the
// email is on the team, so it can't be used to find out who is.
const limiter = createLimiter('team-new-phone', { windowMs: 60 * 60 * 1000, lockMs: 60 * 60 * 1000, maxFailures: 5 });
const DONE = { message: "If that email is on the team, a sign-in code and link are on their way. Type the code below (or open the link on this phone)." };

export async function POST(request) {
  const key = clientKey(request);
  if (limiter.lockedFor(key)) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  limiter.fail(key);   // every request counts: at most 5 an hour from one place
  const body = await request.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  if (!email) return NextResponse.json({ error: 'Enter your email' }, { status: 400 });
  try {
    const m = await (await teamMembers()).findOne({ email, deleted: { $ne: true } });
    if (m && m.active !== false) {
      const link = await createLink(m, m.pin_hash ? 'device' : 'invite');
      await emailLink(m, link, new URL(request.url).origin, m.pin_hash ? 'device' : 'invite');
    }
  } catch { /* same answer either way */ }
  return NextResponse.json(DONE);
}

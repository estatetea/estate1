import { NextResponse } from 'next/server';
import { verifyTeam } from '@/lib/team-auth';

// Is this team session still good? (The owner may have switched the person off or reset their PIN.)
export async function GET(request) {
  const m = await verifyTeam(request).catch(() => null);
  return m ? NextResponse.json({ name: m.name }) : NextResponse.json({ error: 'Signed out' }, { status: 401 });
}

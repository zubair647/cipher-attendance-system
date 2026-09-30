import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { getMentorHomeData } from '../../../lib/mentorData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns the mentor's home data (status, stats, week strip). Called by the
// home screen AFTER it has already painted, so the app never waits on the
// backend before showing something.
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const data = await getMentorHomeData(session);
  if (!data || data.error) {
    return NextResponse.json({ error: data?.error || 'Could not load.' }, { status: 502 });
  }
  return NextResponse.json(data);
}

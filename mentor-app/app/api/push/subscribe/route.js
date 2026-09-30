import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getSession } from '../../../../lib/session';

export const runtime = 'nodejs';

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const { subscription } = await req.json();
  if (!subscription || !subscription.endpoint) {
    return NextResponse.json({ error: 'A valid push subscription is required.' }, { status: 400 });
  }
  const r = await callBackend('savePushSubscription', { mentor_id: s.mentor_id, subscription });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}

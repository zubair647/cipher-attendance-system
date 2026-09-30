import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getSession } from '../../../lib/session';

export const runtime = 'nodejs';

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { photo, capturedAt } = await req.json();
  if (!photo) return NextResponse.json({ error: 'A check-in photo is required.' }, { status: 400 });

  const photo_base64 = String(photo).replace(/^data:image\/[\w+.-]+;base64,/, '');
  const payload = { mentor_id: s.mentor_id, mentor_name: s.name, photo_base64 };
  // Real capture time from the phone, so a delayed upload records the right moment.
  if (capturedAt && capturedAt.date) payload.client_date = capturedAt.date;
  if (capturedAt && capturedAt.time) payload.client_time = capturedAt.time;

  const r = await callBackend('checkIn', payload);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 409 });
  return NextResponse.json({ ok: true, checkInAt: r.check_in_time, duplicate: !!r.duplicate });
}

import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getSession } from '../../../lib/session';

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { photo } = await req.json();
  if (!photo) return NextResponse.json({ error: 'A check-in photo is required.' }, { status: 400 });

  // The camera gives us a data URL; the backend wants raw base64.
  const photo_base64 = String(photo).replace(/^data:image\/[\w+.-]+;base64,/, '');
  const r = await callBackend('checkIn', { mentor_id: s.mentor_id, mentor_name: s.name, photo_base64 });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 409 });
  return NextResponse.json({ ok: true, checkInAt: r.check_in_time });
}

import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getSession } from '../../../lib/session';

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { photo } = await req.json();
  if (!photo) return NextResponse.json({ error: 'A check-out photo is required.' }, { status: 400 });

  const photo_base64 = String(photo).replace(/^data:image\/[\w+.-]+;base64,/, '');
  const r = await callBackend('checkOut', { mentor_id: s.mentor_id, mentor_name: s.name, photo_base64 });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 409 });
  return NextResponse.json({ ok: true, checkOutAt: r.check_out_time, hours: r.hours });
}

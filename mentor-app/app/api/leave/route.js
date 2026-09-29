import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getSession } from '../../../lib/session';

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { reason } = await req.json();
  const trimmed = (reason || '').trim();
  if (trimmed.length < 1 || trimmed.length > 280) {
    return NextResponse.json({ error: 'Reason must be 1–280 characters.' }, { status: 400 });
  }
  const r = await callBackend('markLeave', { mentor_id: s.mentor_id, reason: trimmed });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 409 });
  return NextResponse.json({ ok: true });
}

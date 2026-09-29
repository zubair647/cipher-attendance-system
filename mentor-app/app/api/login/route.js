import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { setSessionCookie } from '../../../lib/session';

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  const r = await callBackend('login', { email, password });
  if (r.error || !r.mentor) {
    return NextResponse.json({ error: r.error || 'Invalid email or password.' }, { status: 401 });
  }
  setSessionCookie(r.mentor);
  return NextResponse.json({ ok: true });
}

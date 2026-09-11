import { NextResponse } from 'next/server';
import { readDb } from '@cipher/shared';
import { setSessionCookie } from '../../../lib/session';

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  const db = readDb();
  const mentor = db.mentors.find(
    (m) => m.email.toLowerCase() === String(email).toLowerCase() && m.password === password
  );
  if (!mentor) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  if (!mentor.active) {
    return NextResponse.json({ error: 'This account has been deactivated. Contact your coordinator.' }, { status: 403 });
  }
  setSessionCookie(mentor.id);
  return NextResponse.json({ ok: true });
}

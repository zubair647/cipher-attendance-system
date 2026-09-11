import { NextResponse } from 'next/server';
import { readDb } from '@cipher/shared';
import { setSessionCookie } from '../../../lib/session';

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  const db = readDb();
  const admin = db.admins.find(
    (a) => a.email.toLowerCase() === String(email).toLowerCase() && a.password === password
  );
  if (!admin) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  setSessionCookie(admin.id);
  return NextResponse.json({ ok: true });
}

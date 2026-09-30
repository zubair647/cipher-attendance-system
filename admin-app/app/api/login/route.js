import { NextResponse } from 'next/server';
import { setAdminCookie } from '../../../lib/session';

// The backend has no admin accounts, so the dashboard's admin sign-in is
// validated here against the configured ADMIN_EMAIL / ADMIN_PASSWORD.
export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  const okEmail = (process.env.ADMIN_EMAIL || 'admin@cipherschools.com').toLowerCase();
  const okPass = process.env.ADMIN_PASSWORD || 'admin123';
  if (email.toLowerCase() !== okEmail || password !== okPass) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  setAdminCookie({ email: okEmail, name: 'Ops Admin' });
  return NextResponse.json({ ok: true });
}

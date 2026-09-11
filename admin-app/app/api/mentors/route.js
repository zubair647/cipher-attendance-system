import { NextResponse } from 'next/server';
import { readDb, writeDb, newId } from '@cipher/shared';
import { getSessionAdminId } from '../../../lib/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  if (!getSessionAdminId()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { name, email, universityId, password } = await req.json();
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Full name is required.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (!universityId) errors.universityId = 'Select a university.';
  if (!password || password.length < 8) errors.password = 'Temporary password must be at least 8 characters.';

  const db = readDb();
  if (email && db.mentors.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
    errors.email = 'A mentor with this email already exists.';
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'Please fix the highlighted fields.', fields: errors }, { status: 400 });
  }

  const mentor = {
    id: newId('mentor'),
    name: name.trim(),
    email: email.trim(),
    password,
    universityId,
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.mentors.push(mentor);
  writeDb(db);
  return NextResponse.json({ ok: true, mentor });
}

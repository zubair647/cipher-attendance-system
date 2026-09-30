import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getAdmin } from '../../../lib/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  if (!getAdmin()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const { name, email, university, password } = await req.json();

  // The backend doesn't validate, so we do it here (matching the old rules).
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Full name is required.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (!university) errors.universityId = 'Select a university.';
  if (!password || password.length < 8) errors.password = 'Temporary password must be at least 8 characters.';

  if (email && EMAIL_RE.test(email)) {
    const existing = await callBackend('getMentors', {});
    if ((existing.mentors || []).some((m) => String(m.email).toLowerCase() === email.toLowerCase())) {
      errors.email = 'A mentor with this email already exists.';
    }
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'Please fix the highlighted fields.', fields: errors }, { status: 400 });
  }

  const r = await callBackend('addMentor', { name: name.trim(), email: email.trim(), password, university });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

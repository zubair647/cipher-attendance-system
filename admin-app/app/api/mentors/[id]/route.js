import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@cipher/shared';
import { getSessionAdminId } from '../../../../lib/session';

export async function PATCH(req, { params }) {
  if (!getSessionAdminId()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const body = await req.json();
  const db = readDb();
  const mentor = db.mentors.find((m) => m.id === params.id);
  if (!mentor) return NextResponse.json({ error: 'Mentor not found.' }, { status: 404 });

  if (typeof body.active === 'boolean') mentor.active = body.active;
  if (typeof body.newPassword === 'string') {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    mentor.password = body.newPassword;
    mentor.passwordResetAt = new Date().toISOString();
  }
  if (typeof body.universityId === 'string') mentor.universityId = body.universityId;

  writeDb(db);
  return NextResponse.json({ ok: true, mentor });
}

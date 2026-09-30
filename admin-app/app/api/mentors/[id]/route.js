import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getAdmin } from '../../../../lib/session';

// Reset a mentor's password.
export async function PATCH(req, { params }) {
  if (!getAdmin()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const body = await req.json();
  if (typeof body.newPassword === 'string') {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    const r = await callBackend('updateMentorPassword', { mentor_id: params.id, new_password: body.newPassword });
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
}

// Remove a mentor (hard delete — the backend has no deactivate).
export async function DELETE(req, { params }) {
  if (!getAdmin()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const r = await callBackend('deleteMentor', { mentor_id: params.id });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

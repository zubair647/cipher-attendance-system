import { NextResponse } from 'next/server';
import { readDb, writeDb, todayStr } from '@cipher/shared';
import { getSessionMentorId } from '../../../lib/session';

export async function POST(req) {
  const mentorId = getSessionMentorId();
  if (!mentorId) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { photo } = await req.json();
  if (!photo) return NextResponse.json({ error: 'A check-out photo is required.' }, { status: 400 });

  const db = readDb();
  const today = todayStr();
  const record = db.attendance.find((a) => a.mentorId === mentorId && a.date === today);

  if (!record || !record.checkInAt) {
    return NextResponse.json({ error: 'You need to check in before you can check out.' }, { status: 409 });
  }
  if (record.checkOutAt) {
    return NextResponse.json({ error: 'You have already checked out today.' }, { status: 409 });
  }

  record.checkOutAt = new Date().toISOString();
  record.checkOutPhoto = photo;
  writeDb(db);
  return NextResponse.json({ ok: true, checkOutAt: record.checkOutAt });
}

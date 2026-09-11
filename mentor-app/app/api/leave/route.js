import { NextResponse } from 'next/server';
import { readDb, writeDb, newId, todayStr } from '@cipher/shared';
import { getSessionMentorId } from '../../../lib/session';

export async function POST(req) {
  const mentorId = getSessionMentorId();
  if (!mentorId) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { reason } = await req.json();
  const trimmed = (reason || '').trim();
  if (trimmed.length < 1 || trimmed.length > 280) {
    return NextResponse.json({ error: 'Reason must be 1–280 characters.' }, { status: 400 });
  }

  const db = readDb();
  const today = todayStr();
  let record = db.attendance.find((a) => a.mentorId === mentorId && a.date === today);

  if (record && record.checkInAt) {
    return NextResponse.json({ error: 'You have already checked in today; leave can only be marked before check-in.' }, { status: 409 });
  }
  if (record && record.leaveReason) {
    return NextResponse.json({ error: 'Leave has already been marked for today.' }, { status: 409 });
  }

  if (record) {
    record.leaveReason = trimmed;
  } else {
    record = {
      id: newId('att'),
      mentorId,
      date: today,
      checkInAt: null,
      checkInPhoto: null,
      checkOutAt: null,
      checkOutPhoto: null,
      leaveReason: trimmed,
      hoursOverride: null,
      correctedBy: null,
      correctedAt: null,
      note: null,
    };
    db.attendance.push(record);
  }
  writeDb(db);
  return NextResponse.json({ ok: true });
}

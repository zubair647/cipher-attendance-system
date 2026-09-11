import { NextResponse } from 'next/server';
import { readDb, writeDb, newId, todayStr } from '@cipher/shared';
import { getSessionMentorId } from '../../../lib/session';

export async function POST(req) {
  const mentorId = getSessionMentorId();
  if (!mentorId) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { photo } = await req.json();
  if (!photo) return NextResponse.json({ error: 'A check-in photo is required.' }, { status: 400 });

  const db = readDb();
  const today = todayStr();
  let record = db.attendance.find((a) => a.mentorId === mentorId && a.date === today);

  if (record && (record.checkInAt || record.leaveReason)) {
    return NextResponse.json({ error: 'You have already recorded an action for today.' }, { status: 409 });
  }

  const checkInAt = new Date().toISOString();
  if (record) {
    record.checkInAt = checkInAt;
    record.checkInPhoto = photo;
  } else {
    record = {
      id: newId('att'),
      mentorId,
      date: today,
      checkInAt,
      checkInPhoto: photo,
      checkOutAt: null,
      checkOutPhoto: null,
      leaveReason: null,
      hoursOverride: null,
      correctedBy: null,
      correctedAt: null,
      note: null,
    };
    db.attendance.push(record);
  }
  writeDb(db);
  return NextResponse.json({ ok: true, checkInAt });
}

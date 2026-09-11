import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@cipher/shared';
import { getSessionAdminId } from '../../../../lib/session';

function toISO(dateStr, hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0).toISOString();
}

export async function PATCH(req, { params }) {
  const adminId = getSessionAdminId();
  if (!adminId) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { checkInTime, checkOutTime, note } = await req.json();
  const db = readDb();
  const admin = db.admins.find((a) => a.id === adminId);
  const record = db.attendance.find((a) => a.id === params.id);
  if (!record) return NextResponse.json({ error: 'Attendance record not found.' }, { status: 404 });

  const newCheckIn = checkInTime ? toISO(record.date, checkInTime) : record.checkInAt;
  const newCheckOut = checkOutTime ? toISO(record.date, checkOutTime) : record.checkOutAt;

  if (newCheckIn && newCheckOut) {
    const durationHrs = (new Date(newCheckOut) - new Date(newCheckIn)) / 3600000;
    if (durationHrs <= 0) {
      return NextResponse.json({ error: 'Check-out must be after check-in, on the same day.' }, { status: 400 });
    }
    if (durationHrs > 16) {
      return NextResponse.json({ error: 'That gap is longer than 16 hours — double-check the times.' }, { status: 400 });
    }
  }

  record.checkInAt = newCheckIn;
  record.checkOutAt = newCheckOut;
  record.leaveReason = null; // a manual time correction supersedes a leave entry, if any
  if (note) record.note = note;
  record.correctedBy = admin?.name || admin?.email || 'admin';
  record.correctedAt = new Date().toISOString();

  writeDb(db);
  return NextResponse.json({ ok: true, record });
}

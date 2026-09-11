import { NextResponse } from 'next/server';
import { readDb, writeDb, newId, todayStr } from '@cipher/shared';
import { getSessionAdminId } from '../../../lib/session';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export async function POST(req) {
  if (!getSessionAdminId()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const body = await req.json();
  const { mentorId, effectiveFrom, attachmentName } = body;
  const db = readDb();
  const mentor = db.mentors.find((m) => m.id === mentorId);
  if (!mentor) return NextResponse.json({ error: 'Mentor not found.' }, { status: 404 });

  const counts = {};
  for (const d of DAYS) {
    const n = Number(body[d]);
    if (!Number.isInteger(n) || n < 0 || n > 12) {
      return NextResponse.json({ error: 'Classes per day must be whole numbers from 0 to 12.' }, { status: 400 });
    }
    counts[d] = n;
  }
  if (!effectiveFrom || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
    return NextResponse.json({ error: 'Choose a valid effective-from date.' }, { status: 400 });
  }
  const today = todayStr();
  if (effectiveFrom < today) {
    return NextResponse.json({ error: 'Effective-from must be today or later.' }, { status: 400 });
  }

  const versions = db.timetables
    .filter((t) => t.mentorId === mentorId)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  const current = versions[0];
  if (current && effectiveFrom <= current.effectiveFrom) {
    return NextResponse.json({ error: 'Effective-from must be after the current version\'s start date.' }, { status: 400 });
  }

  if (current) {
    current.effectiveTo = addDays(effectiveFrom, -1);
  }

  const version = {
    id: newId('tt'),
    mentorId,
    ...counts,
    minutesPerClass: 50,
    effectiveFrom,
    effectiveTo: null,
    attachmentName: attachmentName || null,
    createdAt: new Date().toISOString(),
  };
  db.timetables.push(version);
  writeDb(db);
  return NextResponse.json({ ok: true, version });
}

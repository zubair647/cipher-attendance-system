import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getAdmin } from '../../../lib/session';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

function istToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export async function POST(req) {
  if (!getAdmin()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const body = await req.json();
  const { mentorId, effectiveFrom, attachmentName } = body;

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
  if (effectiveFrom < istToday()) {
    return NextResponse.json({ error: 'Effective-from must be today or later.' }, { status: 400 });
  }
  // Ensure it's after the current version's start.
  const existing = await callBackend('getTimetable', { mentor_id: mentorId });
  const versions = (existing.versions || []).slice().sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  if (versions[0] && effectiveFrom <= versions[0].effective_from) {
    return NextResponse.json({ error: "Effective-from must be after the current version's start date." }, { status: 400 });
  }

  const r = await callBackend('updateTimetable', {
    mentor_id: mentorId,
    effective_from: effectiveFrom,
    mon_classes: counts.mon, tue_classes: counts.tue, wed_classes: counts.wed, thu_classes: counts.thu, fri_classes: counts.fri,
    minutes_per_class: 50,
    reference_file_id: attachmentName || '',
  });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

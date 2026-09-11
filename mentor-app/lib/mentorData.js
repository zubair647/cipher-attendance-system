import { readDb, todayStr, scheduledClassesFor, scheduledHoursFor, monthKey } from '@cipher/shared';

const WEEK_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' };

function fmtTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

function fmtDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getMentorHomeData(mentorId) {
  const db = readDb();
  const mentor = db.mentors.find((m) => m.id === mentorId);
  if (!mentor) return null;
  const university = db.universities.find((u) => u.id === mentor.universityId);

  const today = todayStr();
  const record = db.attendance.find((a) => a.mentorId === mentorId && a.date === today) || null;

  let status = 'none';
  if (record?.leaveReason) status = 'onLeave';
  else if (record?.checkOutAt) status = 'checkedOut';
  else if (record?.checkInAt) status = 'checkedIn';

  // Time-of-day greeting, personalized with the mentor's first name.
  // Uses the server's local clock, same as the rest of the app (see the
  // "no timezone handling" limitation in the README).
  const firstName = mentor.name.trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const timeOfDay = hour >= 17 ? 'evening' : hour >= 12 ? 'afternoon' : 'morning';
  let greeting = `Hey ${firstName}, good ${timeOfDay}.`;
  if (timeOfDay === 'morning' && status === 'none') {
    greeting += ' It’s time for check-in.';
  }

  // Classes scheduled today (0 on weekends / if no timetable yet).
  const classesToday = scheduledClassesFor(db.timetables, mentorId, today);

  // Lifetime totals — every present day this mentor has ever logged, summed.
  // Same "classes from the timetable, not from raw clock time" logic as the
  // rest of the app, so this always agrees with what admin sees in Reports.
  const allRecords = db.attendance.filter((a) => a.mentorId === mentorId);
  let lifetimeClasses = 0;
  let lifetimeHours = 0;
  allRecords.forEach((r) => {
    if (r.leaveReason) return;
    if (r.checkInAt && r.checkOutAt) {
      lifetimeClasses += scheduledClassesFor(db.timetables, mentorId, r.date);
      lifetimeHours += r.hoursOverride != null ? r.hoursOverride : scheduledHoursFor(db.timetables, mentorId, r.date);
    }
  });
  lifetimeHours = Math.round(lifetimeHours * 10) / 10;

  // Hours logged this month (sum of computed hours for present days).
  const mk = monthKey(today);
  const monthRecords = db.attendance.filter((a) => a.mentorId === mentorId && a.date.startsWith(mk));
  let monthHours = 0;
  monthRecords.forEach((r) => {
    if (r.leaveReason) return;
    if (r.checkInAt && r.checkOutAt) {
      monthHours += r.hoursOverride != null ? r.hoursOverride : scheduledHoursFor(db.timetables, mentorId, r.date);
    }
  });
  monthHours = Math.round(monthHours * 10) / 10;

  // Last check-out before today.
  const past = db.attendance
    .filter((a) => a.mentorId === mentorId && a.checkOutAt && a.date < today)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const lastCheckout = past[0] ? fmtTime(past[0].checkOutAt) : null;

  // This week's Mon-Fri strip.
  const now = fmtDateStr(today);
  const dow = now.getDay(); // 0=Sun..6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const weekStrip = ['mon', 'tue', 'wed', 'thu', 'fri'].map((k, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const r = db.attendance.find((a) => a.mentorId === mentorId && a.date === dateStr);
    const isFuture = dateStr > today;
    let entry = { key: k, label: WEEK_LABELS[k], dateStr, isFuture, isToday: dateStr === today };
    if (r?.leaveReason) {
      entry.type = 'leave';
    } else if (r?.checkInAt && r?.checkOutAt) {
      entry.type = 'present';
      entry.hours = r.hoursOverride != null ? r.hoursOverride : scheduledHoursFor(db.timetables, mentorId, dateStr);
    } else if (isFuture) {
      entry.type = 'future';
    } else {
      entry.type = 'future'; // no record yet / not started
    }
    return entry;
  });

  return {
    mentor: { id: mentor.id, name: mentor.name, email: mentor.email },
    university: university ? { code: university.code, name: university.name } : null,
    today,
    status,
    greeting,
    record: record ? {
      checkInAt: record.checkInAt,
      checkInAtFmt: fmtTime(record.checkInAt),
      checkInPhoto: record.checkInPhoto,
      checkOutAt: record.checkOutAt,
      checkOutAtFmt: fmtTime(record.checkOutAt),
      checkOutPhoto: record.checkOutPhoto,
      leaveReason: record.leaveReason || null,
    } : null,
    classesToday,
    lifetimeClasses,
    lifetimeHours,
    monthHours,
    lastCheckout,
    weekStrip,
    dateDisplay: {
      weekday: now.toLocaleDateString('en-IN', { weekday: 'long' }),
      full: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    },
  };
}

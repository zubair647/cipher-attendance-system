import { readDb, todayStr, monthKey, scheduledHoursFor, deriveDay } from '@cipher/shared';

function fmtTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}
function toTimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function fmtDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDaysStr(dateStr, delta) {
  const d = fmtDay(dateStr);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function allDerivedRecords(db, mentorId) {
  const today = todayStr();
  return db.attendance
    .filter((a) => a.mentorId === mentorId)
    .map((r) => deriveDay(r, db.timetables, today))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function mentorsById(db) {
  const map = {};
  db.mentors.forEach((m) => { map[m.id] = m; });
  return map;
}
export function universitiesById(db) {
  const map = {};
  db.universities.forEach((u) => { map[u.id] = u; });
  return map;
}

// ---------- Overview ----------
export function getOverviewData() {
  const db = readDb();
  const today = todayStr();
  const mk = monthKey(today);
  const uni = universitiesById(db);

  const activeMentors = db.mentors.filter((m) => m.active).length;
  const totalMentors = db.mentors.length;

  let hoursThisMonth = 0;
  let onLeaveToday = [];
  let flagged = [];
  const perDay = {}; // dateStr -> hours, last 30 days

  const last30 = [];
  for (let i = 29; i >= 0; i--) last30.push(addDaysStr(today, -i));
  last30.forEach((d) => { perDay[d] = 0; });

  db.mentors.forEach((mentor) => {
    const derived = allDerivedRecords(db, mentor.id);
    derived.forEach((r) => {
      if (r.date.startsWith(mk) && r.status === 'present') hoursThisMonth += r.hours || 0;
      if (perDay[r.date] !== undefined && r.status === 'present') perDay[r.date] += r.hours || 0;
      if (r.date === today && r.status === 'leave') onLeaveToday.push(mentor);
      if (r.status === 'flagged') {
        flagged.push({
          id: r.id,
          mentorId: mentor.id,
          mentorName: mentor.name,
          universityCode: uni[mentor.universityId]?.code,
          date: r.date,
          checkInAtFmt: fmtTime(r.checkInAt),
        });
      }
    });
  });

  flagged.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    activeMentors,
    totalMentors,
    hoursThisMonth: round1(hoursThisMonth),
    monthLabel: fmtDay(today + '').toLocaleDateString('en-IN', { month: 'long' }),
    onLeaveToday,
    flaggedCount: flagged.length,
    flagged: flagged.slice(0, 6),
    chart: last30.map((d) => ({ date: d, hours: round1(perDay[d]) })),
  };
}

// ---------- Mentors ----------
export function getMentorsList({ query = '', universityId = '' } = {}) {
  const db = readDb();
  const uni = universitiesById(db);
  let list = db.mentors.map((m) => ({
    ...m,
    universityCode: uni[m.universityId]?.code,
    universityName: uni[m.universityId]?.name,
  }));
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }
  if (universityId) list = list.filter((m) => m.universityId === universityId);
  list.sort((a, b) => a.name.localeCompare(b.name));
  return { mentors: list, universities: db.universities, total: db.mentors.length };
}

// ---------- Timetables ----------
export function getTimetableData(mentorId) {
  const db = readDb();
  const uni = universitiesById(db);
  const mentor = db.mentors.find((m) => m.id === mentorId);
  if (!mentor) return null;
  const versions = db.timetables
    .filter((t) => t.mentorId === mentorId)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  return {
    mentor: { ...mentor, universityCode: uni[mentor.universityId]?.code, universityName: uni[mentor.universityId]?.name },
    mentors: db.mentors.map((m) => ({ id: m.id, name: m.name })),
    active: versions[0] || null,
    history: versions.slice(1),
  };
}

// ---------- Attendance log ----------
export function getAttendanceLog({ mentorId = '', universityId = '', from = '', to = '' } = {}) {
  const db = readDb();
  const uni = universitiesById(db);
  const mById = mentorsById(db);
  const today = todayStr();

  let mentorIds = Object.keys(mById);
  if (mentorId) mentorIds = [mentorId];
  if (universityId) mentorIds = mentorIds.filter((id) => mById[id].universityId === universityId);

  let rows = db.attendance.filter((a) => mentorIds.includes(a.mentorId));
  if (from) rows = rows.filter((r) => r.date >= from);
  if (to) rows = rows.filter((r) => r.date <= to);

  rows = rows.map((r) => {
    const d = deriveDay(r, db.timetables, today);
    const mentor = mById[r.mentorId];
    return {
      ...d,
      mentorName: mentor?.name,
      universityCode: uni[mentor?.universityId]?.code,
      checkInAtFmt: fmtTime(r.checkInAt),
      checkOutAtFmt: fmtTime(r.checkOutAt),
      checkInTimeValue: toTimeInput(r.checkInAt),
      checkOutTimeValue: toTimeInput(r.checkOutAt),
      scheduledHours: scheduledHoursFor(db.timetables, r.mentorId, r.date),
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));

  const stats = {
    daysPresent: rows.filter((r) => r.status === 'present').length,
    hoursInRange: round1(rows.reduce((s, r) => s + (r.status === 'present' ? r.hours || 0 : 0), 0)),
    leaveDays: rows.filter((r) => r.status === 'leave').length,
    flagged: rows.filter((r) => r.status === 'flagged').length,
  };

  return {
    rows,
    stats,
    mentors: db.mentors.map((m) => ({ id: m.id, name: m.name })),
    universities: db.universities,
  };
}

// ---------- Reports ----------
export function getReportsData({ mentorId, from = '', to = '' }) {
  const db = readDb();
  const mentor = db.mentors.find((m) => m.id === mentorId);
  if (!mentor) return null;
  const uni = universitiesById(db)[mentor.universityId];
  const today = todayStr();
  const derived = allDerivedRecords(db, mentorId);

  const presentAll = derived.filter((r) => r.status === 'present');
  const leaveAll = derived.filter((r) => r.status === 'leave');
  const lifetimeHours = round1(presentAll.reduce((s, r) => s + (r.hours || 0), 0));
  const firstDate = derived.length ? derived[derived.length - 1].date : today;

  // Per-month totals (up to the 6 most recent months with any activity).
  const byMonth = {};
  derived.forEach((r) => {
    if (r.status !== 'present') return;
    const mk = monthKey(r.date);
    byMonth[mk] = (byMonth[mk] || 0) + (r.hours || 0);
  });
  const monthly = Object.entries(byMonth)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 6)
    .reverse()
    .map(([mk, hrs]) => ({
      month: mk,
      label: fmtDay(mk + '-01').toLocaleDateString('en-IN', { month: 'short' }),
      hours: round1(hrs),
    }));

  // Trend: filter by from/to if given, else last 90 days; weekly buckets.
  const rangeFrom = from || addDaysStr(today, -90);
  const rangeTo = to || today;
  const ranged = derived.filter((r) => r.date >= rangeFrom && r.date <= rangeTo && r.status === 'present');
  const weekBuckets = {};
  ranged.forEach((r) => {
    const weekStart = mondayOf(r.date);
    weekBuckets[weekStart] = (weekBuckets[weekStart] || 0) + (r.hours || 0);
  });
  const trend = Object.entries(weekBuckets)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([week, hrs]) => ({ week, label: shortLabel(week), hours: round1(hrs) }));

  return {
    mentor: { ...mentor, universityCode: uni?.code, universityName: uni?.name },
    mentors: db.mentors.map((m) => ({ id: m.id, name: m.name })),
    lifetimeHours,
    presentDays: presentAll.length,
    leaveDays: leaveAll.length,
    since: firstDate,
    monthly,
    trend,
    range: { from: rangeFrom, to: rangeTo },
  };
}

function mondayOf(dateStr) {
  const d = fmtDay(dateStr);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shortLabel(dateStr) {
  return fmtDay(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function round1(n) { return Math.round((n || 0) * 10) / 10; }

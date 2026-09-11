/**
 * Hour calculation logic, per PRD Section 5 (the authoritative, deterministic
 * spec — "no open design questions"). Used identically by both apps so the
 * Attendance Log, and the Reports lifetime/monthly/trend rollups, always
 * agree with each other.
 *
 *  1. For a given mentor + date, find the day-of-week (Mon-Fri only).
 *  2. Find the TimetableVersion whose effectiveFrom is the most recent one
 *     on or before that date.
 *  3. classCount(day) * 50 minutes -> hours.
 *  4. A LeaveRecord for that date overrides the result to 0.
 *  5. Monthly/lifetime totals are plain sums of daily computed hours, so a
 *     mid-month timetable change is handled automatically.
 */

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MINUTES_PER_CLASS = 50;

function dayKey(dateStr) {
  // dateStr: 'YYYY-MM-DD'. Parse as a plain calendar date (no timezone shift).
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return DAY_KEYS[dt.getDay()];
}

function isWeekday(dateStr) {
  const k = dayKey(dateStr);
  return k !== 'sun' && k !== 'sat';
}

/** Pick the timetable version active on `dateStr` for `mentorId`. */
function activeTimetableFor(timetables, mentorId, dateStr) {
  const versions = timetables
    .filter((t) => t.mentorId === mentorId && t.effectiveFrom <= dateStr)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  return versions[0] || null;
}

/** Scheduled class count for `dateStr`, from whichever timetable version was active that day. */
function scheduledClassesFor(timetables, mentorId, dateStr) {
  if (!isWeekday(dateStr)) return 0;
  const version = activeTimetableFor(timetables, mentorId, dateStr);
  if (!version) return 0;
  const key = dayKey(dateStr); // 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
  return Number(version[key] || 0);
}

/** Scheduled hours for `dateStr` — the class count above, times 50 minutes each. */
function scheduledHoursFor(timetables, mentorId, dateStr) {
  const classCount = scheduledClassesFor(timetables, mentorId, dateStr);
  return round2((classCount * MINUTES_PER_CLASS) / 60);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Derive status + hours for one attendance day record + this mentor's timetables. */
function deriveDay(record, timetables, todayStr) {
  if (record.leaveReason) {
    return { ...record, status: 'leave', hours: 0 };
  }
  if (!record.checkInAt) {
    return { ...record, status: 'absent', hours: null };
  }
  if (record.checkOutAt) {
    const hours = record.hoursOverride != null
      ? record.hoursOverride
      : scheduledHoursFor(timetables, record.mentorId, record.date);
    return { ...record, status: 'present', hours };
  }
  // Checked in, no checkout yet.
  if (record.date === todayStr) {
    return { ...record, status: 'in_progress', hours: null };
  }
  return { ...record, status: 'flagged', hours: null };
}

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

module.exports = {
  MINUTES_PER_CLASS,
  dayKey,
  isWeekday,
  activeTimetableFor,
  scheduledClassesFor,
  scheduledHoursFor,
  deriveDay,
  todayStr,
  monthKey,
  round2,
};

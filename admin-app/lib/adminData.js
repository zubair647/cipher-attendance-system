import { callBackend, normDate, normTime, prettyTime, num } from '@cipher/shared';

const IST = 'Asia/Kolkata';
const UNI_NAMES = { LPU: 'Lovely Professional University', GU: 'Galgotias University' };

function istToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST });
}
function dateFromStr(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDaysStr(s, delta) { const d = dateFromStr(s); d.setDate(d.getDate() + delta); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function round1(n) { return Math.round((n || 0) * 10) / 10; }
function shortDate(s) { return dateFromStr(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }

function uniInfo(str) {
  const code = String(str || '').trim();
  return { id: code, code, name: UNI_NAMES[code] || code };
}
function universitiesFrom(mentors) {
  const set = new Set(['LPU', 'GU']);
  mentors.forEach((m) => { if (m.university) set.add(String(m.university).trim()); });
  return Array.from(set).map((c) => uniInfo(c));
}

async function fetchMentors() {
  const r = await callBackend('getMentors', {});
  return (r.mentors || []).map((m) => ({
    id: m.mentor_id,
    name: m.name,
    email: m.email,
    university: m.university,
    universityCode: m.university,
    universityName: UNI_NAMES[m.university] || m.university,
  }));
}

// Derive display status + hours from a cleaned backend attendance record.
function deriveRow(r, mentorsById, today) {
  const date = normDate(r.date);
  const checkIn = normTime(r.check_in_time);
  const checkOut = normTime(r.check_out_time);
  const override = num(r.admin_hours_override);
  const hours = override != null ? override : num(r.computed_hours);
  const isLeave = String(r.status).toLowerCase() === 'leave' || !!r.leave_reason;
  let status = 'absent';
  if (isLeave) status = 'leave';
  else if (checkIn && checkOut) status = 'present';
  else if (checkIn && !checkOut) status = date === today ? 'in_progress' : 'flagged';
  const mentor = mentorsById[r.mentor_id];
  return {
    id: r.record_id,
    mentorId: r.mentor_id,
    mentorName: mentor?.name || r.mentor_id,
    universityCode: mentor?.university || '',
    date,
    checkIn, checkOut,
    checkInAtFmt: prettyTime(checkIn),
    checkOutAtFmt: prettyTime(checkOut),
    checkInTimeValue: checkIn || '',
    checkOutTimeValue: checkOut || '',
    checkInPhotoId: r.check_in_photo_id || null,
    checkOutPhotoId: r.check_out_photo_id || null,
    leaveReason: r.leave_reason ? String(r.leave_reason) : null,
    hours: status === 'present' ? hours : null,
    status,
  };
}

function mentorsByIdMap(mentors) {
  const map = {};
  mentors.forEach((m) => { map[m.id] = m; });
  return map;
}

// ───────────────────────── Overview ─────────────────────────
export async function getOverviewData() {
  const today = istToday();
  const [mentors, logRes] = await Promise.all([
    fetchMentors(),
    callBackend('getAttendanceLog', {}),
  ]);
  const byId = mentorsByIdMap(mentors);
  const rows = (logRes.records || []).map((r) => deriveRow(r, byId, today));

  const monthPrefix = today.slice(0, 7);
  let hoursThisMonth = 0;
  const onLeaveToday = [];
  const flagged = [];
  const perDay = {};
  const last30 = [];
  for (let i = 29; i >= 0; i--) { const d = addDaysStr(today, -i); last30.push(d); perDay[d] = 0; }

  rows.forEach((r) => {
    if (r.status === 'present' && r.date.startsWith(monthPrefix)) hoursThisMonth += r.hours || 0;
    if (r.status === 'present' && perDay[r.date] !== undefined) perDay[r.date] += r.hours || 0;
    if (r.status === 'leave' && r.date === today) {
      const m = byId[r.mentorId];
      if (m) onLeaveToday.push({ id: m.id, name: m.name });
    }
    if (r.status === 'flagged') {
      flagged.push({
        id: r.id, mentorId: r.mentorId, mentorName: r.mentorName,
        universityCode: r.universityCode, date: r.date, checkInAtFmt: r.checkInAtFmt,
      });
    }
  });
  flagged.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    activeMentors: mentors.length,
    totalMentors: mentors.length,
    hoursThisMonth: round1(hoursThisMonth),
    monthLabel: dateFromStr(today).toLocaleDateString('en-IN', { month: 'long' }),
    onLeaveToday,
    flaggedCount: flagged.length,
    flagged: flagged.slice(0, 6),
    chart: last30.map((d) => ({ date: d, hours: round1(perDay[d]) })),
  };
}

// ───────────────────────── Mentors ─────────────────────────
export async function getMentorsList({ query = '', universityId = '' } = {}) {
  const mentors = await fetchMentors();
  let list = mentors.slice();
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }
  if (universityId) list = list.filter((m) => String(m.university) === universityId);
  list.sort((a, b) => a.name.localeCompare(b.name));
  return { mentors: list, universities: universitiesFrom(mentors), total: mentors.length };
}

// ───────────────────────── Timetables ─────────────────────────
function mapVersion(t) {
  return {
    id: t.timetable_id,
    mentorId: t.mentor_id,
    mon: num(t.mon_classes) || 0, tue: num(t.tue_classes) || 0, wed: num(t.wed_classes) || 0,
    thu: num(t.thu_classes) || 0, fri: num(t.fri_classes) || 0,
    minutesPerClass: num(t.minutes_per_class) || 50,
    effectiveFrom: normDate(t.effective_from),
    effectiveTo: null,
    attachmentName: t.reference_file_id || null,
  };
}
export async function getTimetableData(mentorId) {
  const mentors = await fetchMentors();
  if (!mentorId) mentorId = mentors[0]?.id;
  const mentor = mentors.find((m) => m.id === mentorId);
  if (!mentor) return null;
  const ttRes = await callBackend('getTimetable', { mentor_id: mentorId });
  const versions = (ttRes.versions || []).map(mapVersion)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  // Fill effectiveTo for history (day before the next-newer version starts).
  for (let i = 1; i < versions.length; i++) versions[i].effectiveTo = addDaysStr(versions[i - 1].effectiveFrom, -1);
  return {
    mentor: { ...mentor },
    mentors: mentors.map((m) => ({ id: m.id, name: m.name })),
    active: versions[0] || null,
    history: versions.slice(1),
  };
}

// ───────────────────────── Attendance log ─────────────────────────
export async function getAttendanceLog({ mentorId = '', universityId = '', from = '', to = '' } = {}) {
  const today = istToday();
  const [mentors, logRes] = await Promise.all([
    fetchMentors(),
    callBackend('getAttendanceLog', Object.assign({}, mentorId ? { mentor_id: mentorId } : {}, from ? { start_date: from } : {}, to ? { end_date: to } : {})),
  ]);
  const byId = mentorsByIdMap(mentors);
  let rows = (logRes.records || []).map((r) => deriveRow(r, byId, today));
  if (universityId) rows = rows.filter((r) => String(r.universityCode) === universityId);
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));

  const stats = {
    daysPresent: rows.filter((r) => r.status === 'present').length,
    hoursInRange: round1(rows.reduce((s, r) => s + (r.status === 'present' ? r.hours || 0 : 0), 0)),
    leaveDays: rows.filter((r) => r.status === 'leave').length,
    flagged: rows.filter((r) => r.status === 'flagged').length,
  };
  return {
    rows, stats,
    mentors: mentors.map((m) => ({ id: m.id, name: m.name })),
    universities: universitiesFrom(mentors),
  };
}

// ───────────────────────── Reports ─────────────────────────
function mondayOf(dateStr) {
  const d = dateFromStr(dateStr);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export async function getReportsData({ mentorId, from = '', to = '' }) {
  const today = istToday();
  const mentors = await fetchMentors();
  if (!mentorId) mentorId = mentors[0]?.id;
  const mentor = mentors.find((m) => m.id === mentorId);
  if (!mentor) return null;
  const [repRes, logRes] = await Promise.all([
    callBackend('getReports', Object.assign({ mentor_id: mentorId }, from ? { start_date: from } : {}, to ? { end_date: to } : {})),
    callBackend('getAttendanceLog', { mentor_id: mentorId }),
  ]);
  const byId = mentorsByIdMap(mentors);
  const rows = (logRes.records || []).map((r) => deriveRow(r, byId, today)).sort((a, b) => (a.date < b.date ? 1 : -1));

  const presentDays = rows.filter((r) => r.status === 'present').length;
  const leaveDays = rows.filter((r) => r.status === 'leave').length;
  const since = rows.length ? rows[rows.length - 1].date : today;

  const perMonth = repRes.perMonth || {};
  const monthly = Object.keys(perMonth)
    .filter((k) => /^\d{4}-\d{2}$/.test(k))
    .sort()
    .slice(-6)
    .map((mk) => ({ month: mk, label: dateFromStr(mk + '-01').toLocaleDateString('en-IN', { month: 'short' }), hours: round1(perMonth[mk]) }));

  // Weekly buckets from the daily trend (getReports.trend).
  const rangeFrom = from || addDaysStr(today, -90);
  const rangeTo = to || today;
  const weekBuckets = {};
  (repRes.trend || []).forEach((t) => {
    const d = normDate(t.date);
    if (d < rangeFrom || d > rangeTo) return;
    const wk = mondayOf(d);
    weekBuckets[wk] = (weekBuckets[wk] || 0) + Number(t.hours || 0);
  });
  const trend = Object.keys(weekBuckets).sort().map((wk) => ({ week: wk, label: shortDate(wk), hours: round1(weekBuckets[wk]) }));

  return {
    mentor: { ...mentor, active: true },
    mentors: mentors.map((m) => ({ id: m.id, name: m.name })),
    lifetimeHours: round1(repRes.lifetime || 0),
    presentDays, leaveDays, since,
    monthly, trend,
    range: { from: rangeFrom, to: rangeTo },
  };
}

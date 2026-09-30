import { callBackend, normDate, normTime, prettyTime, num, scheduledClassesFor } from '@cipher/shared';

const IST = 'Asia/Kolkata';
const WEEK = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' },
];
const UNI_NAMES = { LPU: 'Lovely Professional University', GU: 'Galgotias University' };

function istTodayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST }); // YYYY-MM-DD
}
function istHour() {
  return Number(new Date().toLocaleTimeString('en-GB', { timeZone: IST, hour: '2-digit', hour12: false }).slice(0, 2));
}
function dateFromStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Map a backend attendance row to our internal shape.
function mapRecord(r) {
  const checkIn = normTime(r.check_in_time);
  const checkOut = normTime(r.check_out_time);
  const override = num(r.admin_hours_override);
  return {
    date: normDate(r.date),
    checkIn, checkOut,
    checkInPhotoId: r.check_in_photo_id || null,
    checkOutPhotoId: r.check_out_photo_id || null,
    leaveReason: r.leave_reason ? String(r.leave_reason) : null,
    hours: override != null ? override : num(r.computed_hours),
    isLeave: String(r.status).toLowerCase() === 'leave' || !!r.leave_reason,
  };
}

// Map a backend timetable version to the shape scheduledClassesFor expects.
function mapTimetable(t, mentorId) {
  return {
    mentorId,
    mon: num(t.mon_classes) || 0, tue: num(t.tue_classes) || 0, wed: num(t.wed_classes) || 0,
    thu: num(t.thu_classes) || 0, fri: num(t.fri_classes) || 0,
    effectiveFrom: normDate(t.effective_from),
  };
}

async function fetchPhotoDataUrl(id) {
  if (!id) return null;
  const r = await callBackend('getPhoto', { photo_id: id });
  if (r && r.base64) return `data:${r.mimeType || 'image/jpeg'};base64,${r.base64}`;
  return null;
}

export async function getMentorHomeData(session) {
  if (!session) return null;
  const mentorId = session.mentor_id;

  const [logRes, ttRes] = await Promise.all([
    callBackend('getAttendanceLog', { mentor_id: mentorId }),
    callBackend('getTimetable', { mentor_id: mentorId }),
  ]);
  if (logRes.error) return { error: logRes.error };

  const records = (logRes.records || []).map(mapRecord).filter((r) => r.date);
  const timetables = (ttRes.versions || []).map((t) => mapTimetable(t, mentorId));

  const today = istTodayStr();
  const todayRec = records.find((r) => r.date === today) || null;

  let status = 'none';
  if (todayRec?.isLeave) status = 'onLeave';
  else if (todayRec?.checkOut) status = 'checkedOut';
  else if (todayRec?.checkIn) status = 'checkedIn';

  // Greeting
  const firstName = String(session.name || '').trim().split(/\s+/)[0] || 'there';
  const hour = istHour();
  const timeOfDay = hour >= 17 ? 'evening' : hour >= 12 ? 'afternoon' : 'morning';
  let greeting = `Hey ${firstName}, good ${timeOfDay}.`;
  if (timeOfDay === 'morning' && status === 'none') greeting += ' It’s time for check-in.';

  const classesToday = scheduledClassesFor(timetables, mentorId, today);

  // Lifetime + this-month rollups from completed (present) days.
  const monthPrefix = today.slice(0, 7);
  let lifetimeClasses = 0, lifetimeHours = 0, monthHours = 0;
  records.forEach((r) => {
    if (r.isLeave) return;
    if (r.checkIn && r.checkOut) {
      lifetimeClasses += scheduledClassesFor(timetables, mentorId, r.date);
      const h = r.hours || 0;
      lifetimeHours += h;
      if (r.date.startsWith(monthPrefix)) monthHours += h;
    }
  });
  lifetimeHours = Math.round(lifetimeHours * 10) / 10;
  monthHours = Math.round(monthHours * 10) / 10;

  // Last check-out before today.
  const past = records
    .filter((r) => r.checkOut && r.date < today)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const lastCheckout = past[0] ? prettyTime(past[0].checkOut) : null;

  // This week's Mon–Fri strip.
  const now = dateFromStr(today);
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
  const weekStrip = WEEK.map((wd, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const rec = records.find((r) => r.date === ds);
    let type = 'future', hours;
    if (rec?.isLeave) type = 'leave';
    else if (rec?.checkIn && rec?.checkOut) { type = 'present'; hours = rec.hours; }
    else if (ds > today) type = 'future';
    else type = 'future';
    return { key: wd.key, label: wd.label, dateStr: ds, isToday: ds === today, type, hours };
  });

  // Note: we deliberately do NOT fetch the check-in selfie here — that was an
  // extra (slow) backend round trip on every home load. The mentor's own photo
  // isn't essential on their home screen; we show the confirmed time instead.
  const uni = session.university || '';
  return {
    mentor: { id: mentorId, name: session.name, email: session.email },
    university: { code: uni, name: UNI_NAMES[uni] || uni },
    today,
    status,
    greeting,
    record: todayRec ? {
      checkInAtFmt: prettyTime(todayRec.checkIn),
      checkOutAtFmt: prettyTime(todayRec.checkOut),
      leaveReason: todayRec.leaveReason,
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

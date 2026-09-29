/**
 * Seed demo data for the CipherSchools attendance backend.
 * =========================================================
 * This ADDS a function to your EXISTING Apps Script project (the same script
 * bound to your Sheet). It does NOT create a new sheet, deployment, or URL.
 *
 * HOW TO USE
 *   1. In your Apps Script editor, click the ＋ next to "Files" ▸ Script,
 *      name it  Seed  (becomes Seed.gs), and paste this whole file in.
 *   2. Save (💾). In the function dropdown at the top, pick  seedDemoData
 *      and press ▶ Run. Authorize if asked.
 *   3. Open your Sheet — the Mentors / Timetables / Attendance / DailyHours
 *      tabs will now be filled with demo data.
 *
 * It reuses your backend's own helpers (hashPassword, the *_HEADERS constants),
 * so passwords are hashed exactly the way your login() expects.
 *
 * Demo logins (all mentors share one password):
 *   aditi.sharma@cipherschools.com / mentor123   (+ 5 more, see below)
 *
 * Re-running seedDemoData() is safe — it clears the demo rows first, then
 * refills them, so you won't get duplicates.
 */

function seedDemoData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureTab_(ss, 'Mentors', MENTOR_HEADERS);
  ensureTab_(ss, 'Timetables', TIMETABLE_HEADERS);
  ensureTab_(ss, 'Attendance', ATTENDANCE_HEADERS);
  ensureTab_(ss, 'DailyHours', DAILYHOURS_HEADERS);

  // CRITICAL: force date/time columns to plain-text format so Google Sheets
  // stops auto-converting "2026-09-14" and "09:25" into its own date/time
  // values. Without this, the backend's string comparisons (find today's row,
  // date-range filters, month grouping) break — which would stop check-out and
  // garble reports. Applied to the whole column so future app writes stay text.
  setColText_(ss, 'Mentors', MENTOR_HEADERS, ['created_at']);
  setColText_(ss, 'Timetables', TIMETABLE_HEADERS, ['effective_from']);
  setColText_(ss, 'Attendance', ATTENDANCE_HEADERS, ['date', 'check_in_time', 'check_out_time']);
  setColText_(ss, 'DailyHours', DAILYHOURS_HEADERS, ['date']);

  ['Mentors', 'Timetables', 'Attendance', 'DailyHours'].forEach(function (n) { clearData_(ss, n); });

  var MINUTES = 50;
  var startFrom = dateStr_(-21); // timetables effective from ~3 weeks ago

  var seeds = [
    { name: 'Aditi Sharma', email: 'aditi.sharma@cipherschools.com', university: 'LPU', mon: 5, tue: 4, wed: 3, thu: 5, fri: 0 },
    { name: 'Rohan Mehta',  email: 'rohan.mehta@cipherschools.com',  university: 'LPU', mon: 3, tue: 3, wed: 4, thu: 2, fri: 4 },
    { name: 'Kavya Iyer',   email: 'kavya.iyer@cipherschools.com',   university: 'LPU', mon: 4, tue: 4, wed: 4, thu: 4, fri: 2 },
    { name: 'Farhan Ali',   email: 'farhan.ali@cipherschools.com',   university: 'GU',  mon: 5, tue: 0, wed: 5, thu: 0, fri: 5 },
    { name: 'Neha Gupta',   email: 'neha.gupta@cipherschools.com',   university: 'GU',  mon: 2, tue: 3, wed: 3, thu: 3, fri: 2 },
    { name: 'Sanya Kapoor', email: 'sanya.kapoor@cipherschools.com', university: 'GU',  mon: 4, tue: 4, wed: 0, thu: 4, fri: 4 },
  ];

  var mSheet = ss.getSheetByName('Mentors');
  var tSheet = ss.getSheetByName('Timetables');
  var aSheet = ss.getSheetByName('Attendance');
  var dSheet = ss.getSheetByName('DailyHours');
  var pwHash = hashPassword('mentor123');
  var dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  seeds.forEach(function (s, idx) {
    var mentorId = 'mentor_' + (idx + 1);
    mSheet.appendRow([mentorId, s.name, s.email, pwHash, s.university, startFrom]);
    tSheet.appendRow([Utilities.getUuid(), mentorId, startFrom, s.mon, s.tue, s.wed, s.thu, s.fri, MINUTES, '']);

    for (var n = 15; n >= 1; n--) {
      var d = dateStr_(-n);
      var dow = new Date(d).getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends
      var classes = Number(s[dayKeys[dow]] || 0);
      var hours = Math.round((classes * MINUTES / 60) * 100) / 100;
      var seed = pseudo_(mentorId + d);

      if (seed < 0.08) {
        // leave day
        aSheet.appendRow([Utilities.getUuid(), mentorId, d, '', '', '', '', 'leave', leaveReason_(seed), 0, '', '']);
        dSheet.appendRow([mentorId, d, 0, 'leave']);
      } else if (seed < 0.14) {
        // flagged: checked in, never checked out (no DailyHours row)
        aSheet.appendRow([Utilities.getUuid(), mentorId, d, time_(9, 30 + (idx % 20)), '', '', '', 'present', '', '', '', '']);
      } else if (seed < 0.2) {
        // absent — no row at all
      } else {
        // normal present day
        aSheet.appendRow([Utilities.getUuid(), mentorId, d, time_(9, 20 + (idx % 25)), '', time_(16, 40 + (idx % 15)), '', 'present', '', hours, '', '']);
        dSheet.appendRow([mentorId, d, hours, 'computed']);
      }
    }
  });

  Logger.log('Seed complete: ' + seeds.length + ' mentors + timetables + ~2 weeks attendance.');
  Logger.log('Mentor login password for all: mentor123');
}

// ── helpers ──────────────────────────────────────────────────────────────
function ensureTab_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var firstRow = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow.join('') === '') sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}
function setColText_(ss, name, headers, cols) {
  var sh = ss.getSheetByName(name);
  cols.forEach(function (c) {
    var i = headers.indexOf(c);
    if (i < 0) return;
    var letter = String.fromCharCode(65 + i); // works for columns A–Z (our tabs stay well under that)
    sh.getRange(letter + ':' + letter).setNumberFormat('@'); // whole column, incl. future rows
  });
}
function clearData_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
}
function dateStr_(deltaDays) {
  var d = new Date();
  d.setDate(d.getDate() + deltaDays);
  return Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd');
}
function time_(h, m) {
  var hh = (h + Math.floor(m / 60));
  var mm = m % 60;
  return (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm);
}
function leaveReason_(seed) {
  var reasons = ['Family emergency', 'Feeling unwell', 'Personal work', 'Travel delay', 'Festival at home'];
  return reasons[Math.floor(seed * 1000) % reasons.length];
}
function pseudo_(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

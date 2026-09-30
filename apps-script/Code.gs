// ===== CONFIG =====
var DRIVE_FOLDER_ID = '1A50aptVEutcrlLBcnc48NFM_zmtE2wyW'; // Cipher Attendance Photos
var TIMEZONE = 'Asia/Kolkata';

var MENTOR_HEADERS = ['mentor_id','name','email','password_hash','university','created_at'];
var TIMETABLE_HEADERS = ['timetable_id','mentor_id','effective_from','mon_classes','tue_classes','wed_classes','thu_classes','fri_classes','minutes_per_class','reference_file_id'];
var ATTENDANCE_HEADERS = ['record_id','mentor_id','date','check_in_time','check_in_photo_id','check_out_time','check_out_photo_id','status','leave_reason','computed_hours','admin_hours_override','admin_remark'];
var DAILYHOURS_HEADERS = ['mentor_id','date','hours','source'];
var PUSH_HEADERS = ['mentor_id','subscription_json','created_at','endpoint'];

// ===== ENTRY POINTS =====
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var result;
  try {
    var params = {};
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = e.parameter;
    }
    switch (params.action) {
      case 'login': result = login(params); break;
      case 'getMentorStatus': result = getMentorStatus(params); break;
      case 'checkIn': result = checkIn(params); break;
      case 'checkOut': result = checkOut(params); break;
      case 'markLeave': result = markLeave(params); break;
      case 'getPhoto': result = getPhoto(params); break;
      case 'getMentors': result = getMentors(params); break;
      case 'addMentor': result = addMentor(params); break;
      case 'updateMentorPassword': result = updateMentorPassword(params); break;
      case 'deleteMentor': result = deleteMentor(params); break;
      case 'getTimetable': result = getTimetable(params); break;
      case 'updateTimetable': result = updateTimetable(params); break;
      case 'getAttendanceLog': result = getAttendanceLog(params); break;
      case 'editAttendanceRecord': result = editAttendanceRecord(params); break;
      case 'getReports': result = getReports(params); break;
      case 'savePushSubscription': result = savePushSubscription(params); break;
      case 'getPushSubscriptions': result = getPushSubscriptions(params); break;
      case 'deletePushSubscription': result = deletePushSubscription(params); break;
      default: result = { error: 'Unknown action: ' + params.action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
}

// ===== DATE/TIME NORMALIZERS =====
// Google Sheets often stores our "2026-09-30" and "09:25" text as real
// date/time values. When read back they become Date objects, which broke the
// original string comparisons (find today's row, date filters, month keys) and
// made check-out and computed hours fail. These make every comparison safe by
// coercing any value — Date OR string — to a canonical form in IST.
function ymd_(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    var ds = new Date(v);
    return isNaN(ds) ? v : Utilities.formatDate(ds, TIMEZONE, 'yyyy-MM-dd');
  }
  var d = new Date(v);
  return isNaN(d) ? '' : Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd');
}
function hm_(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v)) {
    var p = v.split(':');
    return (p[0].length < 2 ? '0' + p[0] : p[0]) + ':' + p[1];
  }
  var d = new Date(v);
  return isNaN(d) ? String(v) : Utilities.formatDate(d, TIMEZONE, 'HH:mm');
}
// Normalize a raw attendance row's date/time fields to clean strings for output.
function cleanRecord_(r) {
  r.date = ymd_(r.date);
  r.check_in_time = hm_(r.check_in_time);
  r.check_out_time = hm_(r.check_out_time);
  return r;
}

// ===== SHEET HELPERS =====
function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Missing tab: ' + name);
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow.every(function (c) { return c === '' || c === null; })) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}
function mentorsSheet() { return getSheet('Mentors', MENTOR_HEADERS); }
function timetablesSheet() { return getSheet('Timetables', TIMETABLE_HEADERS); }
function attendanceSheet() { return getSheet('Attendance', ATTENDANCE_HEADERS); }
function dailyHoursSheet() { return getSheet('DailyHours', DAILYHOURS_HEADERS); }

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1)
      .filter(function (r) { return r.join('') !== ''; })
      .map(function (row) {
        var obj = {};
        headers.forEach(function (h, i) { obj[h] = row[i]; });
        return obj;
      });
}

function findRowNumber(sheet, colName, value) {
  var data = sheet.getDataRange().getValues();
  var col = data[0].indexOf(colName);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col]) === String(value)) return i + 1;
  }
  return -1;
}

// ===== UTIL =====
function todayStr() { return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'); }
function nowTimeStr() { return Utilities.formatDate(new Date(), TIMEZONE, 'HH:mm'); }

function hashPassword(pw) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw, Utilities.Charset.UTF_8);
  return digest.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function getOrCreateMentorFolder(mentorName) {
  var parent = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var existing = parent.getFoldersByName(mentorName);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(mentorName);
}

function savePhoto(mentorName, dateStr, label, base64Data) {
  var folder = getOrCreateMentorFolder(mentorName);
  var safeName = mentorName.replace(/\s+/g, '-');
  var fileName = dateStr + '_' + label + '_' + safeName + '.jpg';
  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, 'image/jpeg', fileName);
  return folder.createFile(blob).getId();
}

// ===== AUTH =====
function login(p) {
  var mentors = sheetToObjects(mentorsSheet());
  var hash = hashPassword(p.password);
  var match = mentors.filter(function (m) { return m.email === p.email && m.password_hash === hash; })[0];
  if (!match) return { error: 'Invalid email or password' };
  return { mentor: { mentor_id: match.mentor_id, name: match.name, email: match.email, university: match.university } };
}

// ===== ATTENDANCE =====
function getMentorStatus(p) {
  var date = ymd_(p.date || todayStr());
  var rows = sheetToObjects(attendanceSheet());
  var rec = rows.filter(function (r) { return String(r.mentor_id) === String(p.mentor_id) && ymd_(r.date) === date; })[0];
  return { record: rec ? cleanRecord_(rec) : null };
}

function checkIn(p) {
  var date = todayStr(), time = nowTimeStr();
  var photoId = savePhoto(p.mentor_name, date, 'CheckIn', p.photo_base64);
  var sheet = attendanceSheet();
  var rowNum = findRowNumber(sheet, 'record_id', findExistingRecordId(sheet, p.mentor_id, date));
  if (rowNum === -1) {
    sheet.appendRow([Utilities.getUuid(), p.mentor_id, date, time, photoId, '', '', 'present', '', '', '', '']);
  } else {
    sheet.getRange(rowNum, 4).setValue(time);
    sheet.getRange(rowNum, 5).setValue(photoId);
  }
  return { success: true, check_in_time: time };
}

function findExistingRecordId(sheet, mentorId, date) {
  var target = ymd_(date);
  var rows = sheetToObjects(sheet);
  var match = rows.filter(function (r) { return String(r.mentor_id) === String(mentorId) && ymd_(r.date) === target; })[0];
  return match ? match.record_id : null;
}

function checkOut(p) {
  var date = todayStr(), time = nowTimeStr();
  var photoId = savePhoto(p.mentor_name, date, 'CheckOut', p.photo_base64);
  var sheet = attendanceSheet();
  var recId = findExistingRecordId(sheet, p.mentor_id, date);
  var rowNum = findRowNumber(sheet, 'record_id', recId);
  if (rowNum === -1) return { error: 'No check-in found for today' };
  sheet.getRange(rowNum, 6).setValue(time);
  sheet.getRange(rowNum, 7).setValue(photoId);
  var hours = computeHours(p.mentor_id, date);
  sheet.getRange(rowNum, 10).setValue(hours);
  dailyHoursSheet().appendRow([p.mentor_id, date, hours, 'computed']);
  return { success: true, check_out_time: time, hours: hours };
}

function computeHours(mentorId, dateStr) {
  var target = ymd_(dateStr);
  var versions = sheetToObjects(timetablesSheet())
      .filter(function (t) { return String(t.mentor_id) === String(mentorId) && ymd_(t.effective_from) <= target; })
      .sort(function (a, b) { return ymd_(a.effective_from) < ymd_(b.effective_from) ? 1 : -1; });
  if (versions.length === 0) return 0;
  var v = versions[0];
  var parts = target.split('-');
  var dayIdx = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay();
  var dayKey = ['sun','mon','tue','wed','thu','fri','sat'][dayIdx] + '_classes';
  var classes = Number(v[dayKey] || 0);
  return Math.round((classes * Number(v.minutes_per_class) / 60) * 100) / 100;
}

function markLeave(p) {
  var date = ymd_(p.date || todayStr());
  var sheet = attendanceSheet();
  var recId = findExistingRecordId(sheet, p.mentor_id, date);
  var rowNum = findRowNumber(sheet, 'record_id', recId);
  if (rowNum !== -1 && sheet.getRange(rowNum, 4).getValue()) {
    return { error: 'Cannot mark leave after check-in' };
  }
  if (rowNum === -1) {
    sheet.appendRow([Utilities.getUuid(), p.mentor_id, date, '', '', '', '', 'leave', p.reason, 0, '', '']);
  } else {
    sheet.getRange(rowNum, 8).setValue('leave');
    sheet.getRange(rowNum, 9).setValue(p.reason);
    sheet.getRange(rowNum, 10).setValue(0);
  }
  dailyHoursSheet().appendRow([p.mentor_id, date, 0, 'leave']);
  return { success: true };
}

function getPhoto(p) {
  var file = DriveApp.getFileById(p.photo_id);
  var blob = file.getBlob();
  return { base64: Utilities.base64Encode(blob.getBytes()), mimeType: blob.getContentType() };
}

// ===== MENTOR MANAGEMENT =====
function getMentors() {
  return { mentors: sheetToObjects(mentorsSheet()).map(function (m) {
    return { mentor_id: m.mentor_id, name: m.name, email: m.email, university: m.university };
  }) };
}
function addMentor(p) {
  mentorsSheet().appendRow([Utilities.getUuid(), p.name, p.email, hashPassword(p.password), p.university, todayStr()]);
  return { success: true };
}
function updateMentorPassword(p) {
  var sheet = mentorsSheet();
  var rowNum = findRowNumber(sheet, 'mentor_id', p.mentor_id);
  if (rowNum === -1) return { error: 'Mentor not found' };
  sheet.getRange(rowNum, 4).setValue(hashPassword(p.new_password));
  return { success: true };
}
function deleteMentor(p) {
  var sheet = mentorsSheet();
  var rowNum = findRowNumber(sheet, 'mentor_id', p.mentor_id);
  if (rowNum === -1) return { error: 'Mentor not found' };
  sheet.deleteRow(rowNum);
  return { success: true };
}

// ===== TIMETABLES =====
function getTimetable(p) {
  var versions = sheetToObjects(timetablesSheet())
      .filter(function (t) { return String(t.mentor_id) === String(p.mentor_id); })
      .map(function (t) { t.effective_from = ymd_(t.effective_from); return t; })
      .sort(function (a, b) { return a.effective_from < b.effective_from ? 1 : -1; });
  return { versions: versions };
}
function updateTimetable(p) {
  timetablesSheet().appendRow([Utilities.getUuid(), p.mentor_id, ymd_(p.effective_from),
    p.mon_classes, p.tue_classes, p.wed_classes, p.thu_classes, p.fri_classes,
    p.minutes_per_class, p.reference_file_id || '']);
  return { success: true };
}

// ===== ATTENDANCE LOG / REPORTS =====
function getAttendanceLog(p) {
  var start = p.start_date ? ymd_(p.start_date) : null;
  var end = p.end_date ? ymd_(p.end_date) : null;
  var rows = sheetToObjects(attendanceSheet())
      .map(cleanRecord_)
      .filter(function (r) {
        var matchMentor = !p.mentor_id || String(r.mentor_id) === String(p.mentor_id);
        var matchStart = !start || r.date >= start;
        var matchEnd = !end || r.date <= end;
        return matchMentor && matchStart && matchEnd;
      });
  return { records: rows };
}

function editAttendanceRecord(p) {
  var sheet = attendanceSheet();
  var rowNum = findRowNumber(sheet, 'record_id', p.record_id);
  if (rowNum === -1) return { error: 'Record not found' };
  var col = { check_in_time: 4, check_out_time: 6, admin_hours_override: 11, admin_remark: 12 };
  Object.keys(col).forEach(function (key) {
    if (p[key] !== undefined) sheet.getRange(rowNum, col[key]).setValue(p[key]);
  });
  if (p.admin_hours_override !== undefined) {
    var rowVals = sheet.getRange(rowNum, 1, 1, ATTENDANCE_HEADERS.length).getValues()[0];
    var mentorId = rowVals[1], date = ymd_(rowVals[2]);
    dailyHoursSheet().appendRow([mentorId, date, p.admin_hours_override, 'admin_override']);
  }
  return { success: true };
}

// ===== PUSH SUBSCRIPTIONS =====
function pushSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('PushSubscriptions');
  if (!sh) { sh = ss.insertSheet('PushSubscriptions'); sh.getRange(1, 1, 1, PUSH_HEADERS.length).setValues([PUSH_HEADERS]); }
  return sh;
}
function savePushSubscription(p) {
  if (!p.mentor_id || !p.subscription) return { error: 'mentor_id and subscription are required' };
  var endpoint = p.subscription.endpoint || '';
  var sheet = pushSheet();
  var rows = sheetToObjects(sheet);
  if (rows.some(function (r) { return r.endpoint === endpoint; })) return { success: true, deduped: true };
  sheet.appendRow([p.mentor_id, JSON.stringify(p.subscription), todayStr(), endpoint]);
  return { success: true };
}
function getPushSubscriptions() {
  return { subscriptions: sheetToObjects(pushSheet()).map(function (r) {
    return { mentor_id: r.mentor_id, subscription_json: r.subscription_json, endpoint: r.endpoint };
  }) };
}
function deletePushSubscription(p) {
  var sheet = pushSheet();
  var rowNum = findRowNumber(sheet, 'endpoint', p.endpoint);
  if (rowNum !== -1) sheet.deleteRow(rowNum);
  return { success: true };
}

function getReports(p) {
  var rows = sheetToObjects(dailyHoursSheet())
      .filter(function (r) { return String(r.mentor_id) === String(p.mentor_id); })
      .map(function (r) { r.date = ymd_(r.date); return r; });
  var lifetime = rows.reduce(function (sum, r) { return sum + Number(r.hours); }, 0);
  var perMonth = {};
  rows.forEach(function (r) {
    var month = String(r.date).slice(0, 7);
    perMonth[month] = (perMonth[month] || 0) + Number(r.hours);
  });
  var start = p.start_date ? ymd_(p.start_date) : null;
  var end = p.end_date ? ymd_(p.end_date) : null;
  var trend = rows
      .filter(function (r) { return (!start || r.date >= start) && (!end || r.date <= end); })
      .map(function (r) { return { date: r.date, hours: Number(r.hours) }; });
  return { lifetime: lifetime, perMonth: perMonth, trend: trend };
}

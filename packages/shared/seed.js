#!/usr/bin/env node
/**
 * Seeds shared-data/db.json with demo data: 2 universities, 1 admin,
 * 6 mentors with timetables, and ~6 weeks of attendance history so the
 * Reports charts and Admin Overview have something to show immediately.
 *
 * Safe to re-run: it only seeds if db.json doesn't already exist, unless
 * you pass --force.
 */
const fs = require('fs');
const path = require('path');
const { newId } = require('./db');

const dbPath = process.env.CIPHER_DB_PATH || path.join(__dirname, '..', '..', 'shared-data', 'db.json');
const force = process.argv.includes('--force');

if (fs.existsSync(dbPath) && !force) {
  console.log(`[seed] ${dbPath} already exists — leaving it alone (pass --force to reset).`);
  process.exit(0);
}

const universities = [
  { id: 'lpu', name: 'Lovely Professional University', code: 'LPU' },
  { id: 'gu', name: 'Galgotias University', code: 'GU' },
];

const admins = [
  { id: 'admin_1', name: 'Ops Admin', email: 'admin@cipherschools.com', password: 'admin123' },
];

const mentorSeeds = [
  { name: 'Aditi Sharma', email: 'aditi.sharma@cipherschools.com', universityId: 'lpu', mon: 5, tue: 4, wed: 3, thu: 5, fri: 0 },
  { name: 'Rohan Mehta', email: 'rohan.mehta@cipherschools.com', universityId: 'lpu', mon: 3, tue: 3, wed: 4, thu: 2, fri: 4 },
  { name: 'Kavya Iyer', email: 'kavya.iyer@cipherschools.com', universityId: 'lpu', mon: 4, tue: 4, wed: 4, thu: 4, fri: 2 },
  { name: 'Farhan Ali', email: 'farhan.ali@cipherschools.com', universityId: 'gu', mon: 5, tue: 0, wed: 5, thu: 0, fri: 5 },
  { name: 'Neha Gupta', email: 'neha.gupta@cipherschools.com', universityId: 'gu', mon: 2, tue: 3, wed: 3, thu: 3, fri: 2 },
  { name: 'Sanya Kapoor', email: 'sanya.kapoor@cipherschools.com', universityId: 'gu', mon: 4, tue: 4, wed: 0, thu: 4, fri: 4 },
];

const mentors = [];
const timetables = [];
const PROGRAM_START = daysAgoStr(45);

mentorSeeds.forEach((m, i) => {
  const id = `mentor_${i + 1}`;
  mentors.push({
    id,
    name: m.name,
    email: m.email,
    password: 'mentor123',
    universityId: m.universityId,
    active: true,
    createdAt: PROGRAM_START,
  });
  timetables.push({
    id: newId('tt'),
    mentorId: id,
    mon: m.mon, tue: m.tue, wed: m.wed, thu: m.thu, fri: m.fri,
    minutesPerClass: 50,
    effectiveFrom: PROGRAM_START,
    effectiveTo: null,
    attachmentName: null,
    createdAt: PROGRAM_START,
  });
});

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmt(d);
}
function fmt(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}
function isWeekday(d) {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function placeholderPhoto(label) {
  // Small inline SVG data URL as a stand-in for a real captured selfie.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
    <defs>
      <pattern id='p' width='16' height='16' patternTransform='rotate(45)' patternUnits='userSpaceOnUse'>
        <rect width='16' height='16' fill='#2A2D33'/>
        <rect width='8' height='16' fill='#34383F'/>
      </pattern>
    </defs>
    <rect width='240' height='240' fill='url(#p)'/>
    <text x='120' y='128' font-family='ui-monospace,monospace' font-size='13' fill='#C8CBD2' text-anchor='middle'>${label}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

const attendance = [];
const today = new Date();

mentors.forEach((mentor, mi) => {
  for (let n = 45; n >= 1; n--) {
    const d = new Date();
    d.setDate(today.getDate() - n);
    if (!isWeekday(d)) continue;
    const dateStr = fmt(d);

    // Sprinkle in some leave days and one flagged (missing checkout) day per mentor.
    const rand = pseudoRandom(mentor.id + dateStr);
    if (rand < 0.05) {
      attendance.push({
        id: newId('att'),
        mentorId: mentor.id,
        date: dateStr,
        checkInAt: null,
        checkInPhoto: null,
        checkOutAt: null,
        checkOutPhoto: null,
        leaveReason: pickLeaveReason(rand),
        hoursOverride: null,
        correctedBy: null,
        correctedAt: null,
        note: null,
      });
      continue;
    }
    if (rand < 0.09) {
      // Present but flagged: checked in, never checked out.
      const checkIn = new Date(d); checkIn.setHours(9, 30 + (mi % 20), 0, 0);
      attendance.push({
        id: newId('att'),
        mentorId: mentor.id,
        date: dateStr,
        checkInAt: checkIn.toISOString(),
        checkInPhoto: placeholderPhoto('selfie · check-in'),
        checkOutAt: null,
        checkOutPhoto: null,
        leaveReason: null,
        hoursOverride: null,
        correctedBy: null,
        correctedAt: null,
        note: null,
      });
      continue;
    }
    if (rand < 0.12) {
      // Absent, no record at all (mentor just didn't check in that day).
      continue;
    }

    const checkIn = new Date(d); checkIn.setHours(9, 20 + (mi % 25), 0, 0);
    const checkOut = new Date(d); checkOut.setHours(16, 40 + (mi % 30), 0, 0);
    attendance.push({
      id: newId('att'),
      mentorId: mentor.id,
      date: dateStr,
      checkInAt: checkIn.toISOString(),
      checkInPhoto: placeholderPhoto('selfie · check-in'),
      checkOutAt: checkOut.toISOString(),
      checkOutPhoto: placeholderPhoto('selfie · check-out'),
      leaveReason: null,
      hoursOverride: null,
      correctedBy: null,
      correctedAt: null,
      note: null,
    });
  }
});

function pickLeaveReason(seed) {
  const reasons = ['Family emergency', 'Feeling unwell', 'Personal work', 'Travel delay', 'Festival at home'];
  return reasons[Math.floor(seed * 1000) % reasons.length];
}

// Deterministic pseudo-random in [0,1) from a string seed, so re-running
// --force produces the same-looking demo data every time.
function pseudoRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 1000) / 1000;
}

const db = { universities, admins, mentors, timetables, attendance };

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log(`[seed] wrote demo data to ${dbPath}`);
console.log(`[seed] admin login: admin@cipherschools.com / admin123`);
console.log(`[seed] mentor login (any): ${mentors[0].email} / mentor123`);

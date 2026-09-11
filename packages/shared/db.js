/**
 * Tiny file-backed "database" shared by both the mentor-app and admin-app
 * Next.js servers. Deliberately simple: read the whole JSON file, mutate,
 * write it back. This is the prototype's disposable persistence layer per
 * the PRD ("local-only, explicitly throwaway for the prototype") — not a
 * production data store.
 *
 * Both apps resolve the SAME file on disk (../shared-data/db.json relative
 * to the project root) so a check-in from the mentor app is immediately
 * visible in the admin app and vice versa.
 */
const fs = require('fs');
const path = require('path');

function resolveDbPath() {
  if (process.env.CIPHER_DB_PATH) return process.env.CIPHER_DB_PATH;
  // process.cwd() is the workspace folder Next.js was started from
  // (mentor-app/ or admin-app/), which is a sibling of shared-data/.
  return path.join(process.cwd(), '..', 'shared-data', 'db.json');
}

function emptyDb() {
  return {
    universities: [],
    admins: [],
    mentors: [],
    timetables: [],
    attendance: [],
  };
}

function readDb() {
  const file = resolveDbPath();
  if (!fs.existsSync(file)) {
    const fresh = emptyDb();
    writeDb(fresh);
    return fresh;
  }
  const raw = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('cipher-attendance: db.json was unreadable, resetting to empty DB', e);
    const fresh = emptyDb();
    writeDb(fresh);
    return fresh;
  }
}

function writeDb(db) {
  const file = resolveDbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Write atomically-ish: write to a temp file then rename, to reduce the
  // chance of a torn write if both dev servers happen to write at once.
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

/** Read the DB, run `mutator(db)`, persist the (possibly mutated) result. */
function withDb(mutator) {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

function newId(prefix) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : require('crypto').randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

module.exports = { readDb, writeDb, withDb, newId, resolveDbPath };

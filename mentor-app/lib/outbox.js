/**
 * On-device outbox for check-in / check-out captures.
 *
 * This is the "temporary file on the phone" idea: the moment a mentor confirms
 * a photo, we save it here (in the browser's IndexedDB) BEFORE trying to upload.
 * Then we try to upload; on success we delete it. If the upload fails (no
 * network, server waking up, or the mentor closes the app), it stays safely on
 * the phone and uploads automatically the next time the app is open with a
 * connection. Nothing is lost.
 *
 * The capture timestamp is stored here at capture time, so even a delayed upload
 * records the real moment the photo was taken.
 */
const DB_NAME = 'cipher-outbox';
const STORE = 'captures';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addCapture(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite');
    t.objectStore(STORE).put(item);
    t.oncomplete = () => resolve(item);
    t.onerror = () => reject(t.error);
  });
}

export async function allCaptures() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly');
    const req = t.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => a.createdAt - b.createdAt));
    req.onerror = () => reject(req.error);
  });
}

export async function removeCapture(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite');
    t.objectStore(STORE).delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function countCaptures() {
  try { return (await allCaptures()).length; } catch { return 0; }
}

/** Upload one capture. Returns 'done' | 'keep'. */
async function uploadOne(item) {
  const endpoint = item.type === 'checkout' ? '/api/checkout' : '/api/checkin';
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: item.photo, capturedAt: { date: item.date, time: item.time } }),
    });
  } catch {
    return 'keep'; // network is down — keep it for later
  }
  if (res.ok) return 'done';
  let data = {};
  try { data = await res.json(); } catch {}
  // A duplicate / already-recorded / can't-be-completed result means there's no
  // point retrying this item forever — consider it resolved and remove it.
  if (res.status === 409 || /already|duplicate|no check-in/i.test(data.error || '')) return 'done';
  if (res.status === 401) return 'keep'; // logged out — retry after next login
  return 'keep'; // other server error — keep and try again later
}

/** Try to upload everything waiting. Returns { uploaded, remaining }. */
export async function flushOutbox() {
  let items = [];
  try { items = await allCaptures(); } catch { return { uploaded: 0, remaining: 0 }; }
  let uploaded = 0;
  for (const item of items) {
    const result = await uploadOne(item);
    if (result === 'done') { await removeCapture(item.id); uploaded++; }
    else break; // stop on the first failure; try again next time
  }
  return { uploaded, remaining: await countCaptures() };
}

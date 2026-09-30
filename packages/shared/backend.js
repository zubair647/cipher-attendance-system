/**
 * Bridge between the Next.js apps and the CipherSchools Google Apps Script
 * backend (the Web App bound to the Google Sheet).
 *
 * All calls are POSTed as Content-Type: text/plain (the Apps Script CORS
 * workaround). Apps Script answers a POST with a 302 redirect to a
 * script.googleusercontent.com URL that serves the JSON; Node's fetch follows
 * that automatically. We retry a couple of times because that redirect
 * occasionally returns a transient Google error page instead of the JSON.
 *
 * The backend URL comes from the CIPHER_BACKEND_URL environment variable so it
 * is never hard-coded into the app or committed to git.
 */

function backendUrl() {
  var url = process.env.CIPHER_BACKEND_URL;
  if (!url) throw new Error('CIPHER_BACKEND_URL is not set. Add it to the app\'s .env.local file.');
  return url;
}

async function callBackend(action, payload) {
  const body = JSON.stringify(Object.assign({ action }, payload || {}));
  let lastErr = 'unknown error';
  // Apps Script's POST→302→googleusercontent redirect intermittently returns a
  // transient Google HTML error page instead of the JSON, especially on a cold
  // start. Retry generously; once warm it succeeds on the first try.
  // More attempts + capped backoff so a slow Apps Script cold start (which can
  // take 15–25s, returning transient error pages until warm) succeeds instead
  // of falling through to an empty/errored result.
  const MAX_ATTEMPTS = 9;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(backendUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
        cache: 'no-store',
      });
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return JSON.parse(trimmed);
      }
      lastErr = `Transient non-JSON response (HTTP ${res.status}) from backend redirect.`;
    } catch (e) {
      lastErr = String((e && e.message) || e);
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, Math.min(500 * (attempt + 1), 2500))); // 0.5→2.5s cap, ~16s total
    }
  }
  return { error: 'Could not reach the backend. ' + lastErr };
}

// ── Value normalizers ─────────────────────────────────────────────────────
// Google Sheets may hand back dates/times either as clean strings (once the
// columns are plain-text) or, on legacy rows, as full timestamps. These make
// both cases safe.
const IST = 'Asia/Kolkata';

function normDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d)) return typeof v === 'string' ? v : null;
  return d.toLocaleDateString('en-CA', { timeZone: IST }); // → YYYY-MM-DD
}

function normTime(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v)) {
    const [h, m] = v.split(':');
    return h.padStart(2, '0') + ':' + m;
  }
  const d = new Date(v);
  if (isNaN(d)) return null;
  return d.toLocaleTimeString('en-GB', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: false });
}

/** 'HH:mm' → '9:25 am' */
function prettyTime(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${am ? 'am' : 'pm'}`;
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

module.exports = { callBackend, normDate, normTime, prettyTime, num, IST };

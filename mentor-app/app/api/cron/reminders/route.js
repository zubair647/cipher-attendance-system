import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import webpush from 'web-push';

const { reminders: REMINDERS } = require('@cipher/shared/reminders');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IST = 'Asia/Kolkata';
function istToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST });
}

// Called by the GitHub Actions scheduler at each reminder time (IST).
// URL: /api/cron/reminders?slot=<slotId>&secret=<CRON_SECRET>
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const slotId = searchParams.get('slot');

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const slot = REMINDERS.find((r) => r.slot === slotId);
  if (!slot) return NextResponse.json({ error: 'Unknown slot: ' + slotId }, { status: 400 });

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: 'VAPID keys not configured.' }, { status: 500 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@cipherschools.com', pub, priv);

  const today = istToday();
  const [mentorsRes, logRes, subsRes] = await Promise.all([
    callBackend('getMentors', {}),
    callBackend('getAttendanceLog', { start_date: today, end_date: today }),
    callBackend('getPushSubscriptions', {}),
  ]);
  const mentors = mentorsRes.mentors || [];
  const rows = logRes.records || [];

  // Today's status per mentor.
  const statusByMentor = {};
  rows.forEach((r) => {
    const leave = String(r.status).toLowerCase() === 'leave' || !!r.leave_reason;
    statusByMentor[r.mentor_id] = {
      checkedIn: !!r.check_in_time,
      checkedOut: !!r.check_out_time,
      onLeave: leave,
    };
  });

  // Which mentors are eligible for THIS slot?
  const eligible = mentors.filter((m) => {
    const st = statusByMentor[m.mentor_id] || { checkedIn: false, checkedOut: false, onLeave: false };
    if (st.onLeave) return false;                              // on leave → no reminders
    if (slot.type === 'checkin') return !st.checkedIn;         // skip if already checked in
    if (slot.type === 'checkout') return st.checkedIn && !st.checkedOut; // must be in, not out
    return false;
  });
  const eligibleIds = new Set(eligible.map((m) => m.mentor_id));

  // Group subscriptions by mentor.
  const subsByMentor = {};
  (subsRes.subscriptions || []).forEach((s) => {
    if (!eligibleIds.has(s.mentor_id)) return;
    let parsed;
    try { parsed = JSON.parse(s.subscription_json); } catch { return; }
    (subsByMentor[s.mentor_id] = subsByMentor[s.mentor_id] || []).push({ endpoint: s.endpoint, sub: parsed });
  });

  const payload = JSON.stringify({ title: slot.title, body: slot.body, tag: slot.slot, url: '/' });
  let sent = 0;
  const expired = [];
  await Promise.all(
    Object.values(subsByMentor).flat().map(async ({ endpoint, sub }) => {
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) expired.push(endpoint);
      }
    })
  );

  // Best-effort cleanup of dead subscriptions.
  await Promise.all(expired.map((endpoint) => callBackend('deletePushSubscription', { endpoint }).catch(() => {})));

  return NextResponse.json({ ok: true, slot: slot.slot, eligible: eligible.length, sent, cleaned: expired.length });
}

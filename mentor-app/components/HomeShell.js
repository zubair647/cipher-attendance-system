'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Circle, Square } from 'lucide-react';
import Logo from './Logo';
import LeaveSheet from './LeaveSheet';
import PwaManager from './PwaManager';
import SplashScreen from './SplashScreen';
import { flushOutbox } from '../lib/outbox';

const IST = 'Asia/Kolkata';
const UNI_NAMES = { LPU: 'Lovely Professional University', GU: 'Galgotias University' };
const STATUS_DOT = { none: '#B9BDC6', checkedIn: '#2E8B57', checkedOut: '#2E8B57', onLeave: '#C99A2E' };

function firstNameOf(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'there';
}
// Instant greeting from the phone clock — shown before backend data arrives.
function instantGreeting(name) {
  const hour = Number(new Date().toLocaleTimeString('en-GB', { timeZone: IST, hour: '2-digit', hour12: false }).slice(0, 2));
  const t = hour >= 17 ? 'evening' : hour >= 12 ? 'afternoon' : 'morning';
  return `Hey ${firstNameOf(name)}, good ${t}.`;
}
function todayDisplay() {
  const now = new Date();
  return {
    weekday: now.toLocaleDateString('en-IN', { timeZone: IST, weekday: 'long' }),
    full: now.toLocaleDateString('en-IN', { timeZone: IST, day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

export default function HomeShell({ session, banner }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const initials = String(session.name || '').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const uniCode = session.university || '';
  const uniName = UNI_NAMES[uniCode] || uniCode;
  const date = todayDisplay();
  const greeting = data?.greeting || instantGreeting(session.name);

  const [attempt, setAttempt] = useState(0);
  const [waking, setWaking] = useState(false);

  // Animated splash — shown once per browser session while the app loads.
  const [mounted, setMounted] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    setMounted(true);
    try { if (sessionStorage.getItem('cs_splash_shown') === '1') setSplashDone(true); } catch {}
  }, []);
  function finishSplash() {
    try { sessionStorage.setItem('cs_splash_shown', '1'); } catch {}
    setSplashDone(true);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(false);
      // Try a few times on our own before bothering the user — a cold backend
      // often succeeds on the 2nd or 3rd try a few seconds apart.
      for (let i = 0; i < 3 && !cancelled; i++) {
        if (i > 0) { setWaking(true); await new Promise((r) => setTimeout(r, 3000)); }
        try {
          const res = await fetch('/api/home', { cache: 'no-store' });
          if (!res.ok) throw new Error('load failed');
          const json = await res.json();
          if (!cancelled) { setData(json); setWaking(false); }
          return;
        } catch {
          // keep trying
        }
      }
      if (!cancelled) { setWaking(false); setLoadError(true); }
    }
    load();
    return () => { cancelled = true; };
  }, [attempt]);

  function retry() { setData(null); setLoadError(false); setAttempt((a) => a + 1); }

  // Upload any captures saved on the phone (from a spotty-network confirm), now
  // and whenever the device comes back online.
  const [pending, setPending] = useState(0);
  const [flushing, setFlushing] = useState(false);
  async function flush() {
    setFlushing(true);
    const { uploaded, remaining } = await flushOutbox();
    setPending(remaining);
    setFlushing(false);
    if (uploaded > 0) setAttempt((a) => a + 1); // refresh home to reflect the upload
  }
  useEffect(() => {
    flush();
    const onOnline = () => flush();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const status = data?.status;

  return (
    <>
    {mounted && !splashDone && (
      <SplashScreen ready={!!data || loadError} onDone={finishSplash} />
    )}
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto">
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-[16px] font-semibold">CSAS</span>
        </div>
        <button onClick={logout} title="Log out"
          className="w-[38px] h-[38px] rounded-full bg-[#22252A] text-white text-[13px] font-semibold flex items-center justify-center">
          {initials}
        </button>
      </header>

      <main className="flex-1 px-5 pb-8">
        <p className="text-[17px] font-semibold text-text-primary mt-1 mb-3">{greeting} 👋</p>

        <PwaManager />

        {pending > 0 && (
          <div className="rounded-2xl border border-leave-border bg-leave-bg p-3.5 flex items-center justify-between gap-3 mb-3">
            <div className="text-[13.5px] text-leave-body">
              {pending} photo{pending > 1 ? 's' : ''} saved on your phone, waiting to upload{flushing ? '…' : '.'}
            </div>
            <button onClick={flush} disabled={flushing} className="text-[13px] font-semibold text-accent-ink disabled:opacity-50 shrink-0">
              {flushing ? 'Uploading…' : 'Retry'}
            </button>
          </div>
        )}

        {banner && data && <SuccessBanner banner={banner} data={data} />}

        <div className="mt-3 mb-4">
          <div className="text-[14px] text-text-secondary">{date.weekday}</div>
          <div className="text-[28px] font-semibold tracking-[-0.025em]">{date.full}</div>
        </div>

        {/* Status card */}
        <div className="bg-surface rounded-2xl shadow-card p-[22px]">
          <div className="text-[14px] text-text-secondary mb-2">Today&apos;s status</div>
          {!data ? (
            loadError ? (
              <RetryRow onRetry={retry} />
            ) : (
              <>
                <Skeleton w="60%" h={26} />
                {waking && <div className="text-[13px] text-text-secondary mt-2">Waking up the server…</div>}
                <div className="h-px bg-border my-4" />
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => <div key={i} className="flex flex-col items-center gap-1.5"><Skeleton w={36} h={20} /><Skeleton w={54} h={11} /></div>)}
                </div>
              </>
            )
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_DOT[status] }} />
                <span className="text-[22px] font-semibold tracking-[-0.02em]">{statusLabel(data)}</span>
              </div>

              {status === 'onLeave' && (
                <>
                  <div className="mt-4 rounded-2xl border border-leave-border bg-leave-bg p-4">
                    <div className="text-[13px] font-semibold text-leave-fg mb-1">Reason submitted</div>
                    <div className="text-[15px] text-leave-body">{data.record.leaveReason}</div>
                  </div>
                  <div className="h-px bg-border my-4" />
                  <div className="text-[13px] text-text-secondary">No further action today. Check-in reopens tomorrow at 12:00 am.</div>
                </>
              )}

              {status === 'checkedIn' && (
                <>
                  <div className="h-px bg-border my-4" />
                  <div className="text-[13px] text-text-secondary">Check-in photo saved · <span className="font-mono">{data.record.checkInAtFmt}</span></div>
                </>
              )}

              {(status === 'none' || status === 'checkedOut') && (
                <>
                  <div className="h-px bg-border my-4" />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Metric label="Classes today" value={data.classesToday} />
                    <Metric label="Hours this month" value={data.monthHours} />
                    <Metric label="Last check-out" value={data.lastCheckout || '—'} small />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Teaching stats */}
        <div className="bg-surface rounded-2xl shadow-card p-[18px] mt-4">
          <div className="text-[14px] font-medium mb-3">Your teaching stats</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {data ? (
              <>
                <Metric label="Classes till date" value={data.lifetimeClasses} />
                <Metric label="Hours till date" value={data.lifetimeHours} />
                <Metric label="Classes today" value={data.classesToday} />
              </>
            ) : loadError ? (
              <>
                <Metric label="Classes till date" value="—" />
                <Metric label="Hours till date" value="—" />
                <Metric label="Classes today" value="—" />
              </>
            ) : (
              [0, 1, 2].map((i) => <div key={i} className="flex flex-col items-center gap-1.5"><Skeleton w={40} h={22} /><Skeleton w={64} h={11} /></div>)
            )}
          </div>
        </div>

        {/* Week strip (leave state only, matches prior behavior) */}
        {status === 'onLeave' && data.weekStrip && (
          <div className="bg-surface rounded-2xl shadow-card p-[18px] mt-4">
            <div className="text-[14px] font-medium mb-3">This week</div>
            <div className="flex justify-between">
              {data.weekStrip.map((d) => <WeekDot key={d.key} d={d} />)}
            </div>
          </div>
        )}

        {/* Primary actions */}
        <div className="mt-6 flex flex-col gap-3">
          {!data ? (
            loadError ? null : <div className="h-16 rounded-2xl bg-border-soft animate-pulse" />
          ) : (
            <>
              {status === 'none' && (
                <Link href="/checkin" className="h-16 rounded-2xl bg-accent text-white text-[19px] font-semibold shadow-button-orange flex items-center justify-center gap-2.5">
                  <Circle size={16} strokeWidth={2.5} /> Check in
                </Link>
              )}
              {status === 'checkedIn' && (
                <Link href="/checkout" className="h-16 rounded-2xl bg-[#22252A] text-white text-[19px] font-semibold flex items-center justify-center gap-2.5">
                  <Square size={16} strokeWidth={2.5} /> Check out
                </Link>
              )}
              {status === 'none' && (
                <button onClick={() => setLeaveOpen(true)} className="h-[52px] rounded-2xl bg-white border border-border text-[16px] font-medium">
                  Mark leave for today
                </button>
              )}
            </>
          )}
          <div className="text-[13px] text-text-secondary text-center px-2">
            Check-in requires a photo. Leave can only be marked before your first check-in of the day.
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-surface border-t border-border px-[26px] pt-[14px] pb-[20px] flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold">{session.name}</div>
          <div className="text-[13px] text-text-secondary">Mentor · {uniName}</div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-accent-tint text-accent-nav-ink text-[13px] font-semibold">{uniCode}</div>
      </footer>

      {leaveOpen && (
        <LeaveSheet dateLabel={`${date.weekday}, ${date.full}`} onClose={() => setLeaveOpen(false)} />
      )}
    </div>
    </>
  );
}

function statusLabel(d) {
  switch (d.status) {
    case 'checkedIn': return `Checked in at ${d.record.checkInAtFmt}`;
    case 'checkedOut': return `Checked out at ${d.record.checkOutAtFmt}`;
    case 'onLeave': return 'On leave';
    default: return 'Not checked in';
  }
}
function Metric({ label, value, small }) {
  return (
    <div>
      <div className={`font-semibold ${small ? 'text-[15px]' : 'text-[18px]'}`}>{value}</div>
      <div className="text-[12px] text-text-secondary mt-0.5">{label}</div>
    </div>
  );
}
function Skeleton({ w, h }) {
  return <span className="inline-block rounded-md bg-border-soft animate-pulse" style={{ width: w, height: h }} />;
}
function RetryRow({ onRetry }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[15px] text-text-secondary">Couldn’t load — the server may be waking up.</span>
      <button onClick={onRetry} className="text-[14px] font-semibold text-accent-ink">Retry</button>
    </div>
  );
}
function WeekDot({ d }) {
  let cls = 'bg-[#F0F1F4] text-text-tertiary';
  let content = '—';
  if (d.type === 'present') { cls = 'bg-present-bg text-present-fg'; content = d.hours; }
  if (d.type === 'leave') { cls = 'bg-leave-bg text-leave-fg'; content = 'L'; }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-semibold ${cls} ${d.isToday ? 'ring-2 ring-accent' : ''}`}>{content}</div>
      <div className="text-[11px] text-text-tertiary">{d.label}</div>
    </div>
  );
}
function SuccessBanner({ banner, data }) {
  let title = '', detail = '';
  if (banner === 'checkin') { title = `Checked in at ${data.record?.checkInAtFmt || ''}`; detail = 'Have a great session today.'; }
  if (banner === 'checkout') { title = `Checked out at ${data.record?.checkOutAtFmt || ''}`; detail = 'Today’s hours have been recorded.'; }
  if (banner === 'leave') { title = 'Leave recorded for today'; detail = 'Your coordinator can see the reason in the attendance log.'; }
  if (!title) return null;
  return (
    <div className="rounded-2xl border border-present-border bg-present-bg p-3.5 flex items-start gap-3 mb-1">
      <span className="w-5 h-5 rounded-full bg-present-dot text-white flex items-center justify-center shrink-0 mt-0.5">
        <Check size={13} strokeWidth={3} />
      </span>
      <div>
        <div className="text-[15px] font-semibold text-present-fg">{title}</div>
        <div className="text-[13px] text-[#3F7A5C] mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

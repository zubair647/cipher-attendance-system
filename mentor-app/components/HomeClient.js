'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Circle, Square } from 'lucide-react';
import Logo from './Logo';
import LeaveSheet from './LeaveSheet';

const STATUS_DOT = {
  none: '#B9BDC6',
  checkedIn: '#2E8B57',
  checkedOut: '#2E8B57',
  onLeave: '#C99A2E',
};

const STATUS_LABEL = (d) => {
  switch (d.status) {
    case 'checkedIn': return `Checked in at ${d.record.checkInAtFmt}`;
    case 'checkedOut': return `Checked out at ${d.record.checkOutAtFmt}`;
    case 'onLeave': return 'On leave';
    default: return 'Not checked in';
  }
};

export default function HomeClient({ data, banner }) {
  const router = useRouter();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const initials = data.mentor.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto">
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2.5">
          <Logo size={22} borderWidth={2.5} />
          <span className="text-[16px] font-semibold">CipherSchools</span>
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="w-[38px] h-[38px] rounded-full bg-[#22252A] text-white text-[13px] font-semibold flex items-center justify-center"
        >
          {initials}
        </button>
      </header>

      <main className="flex-1 px-5 pb-8">
        <p className="text-[17px] font-semibold text-text-primary mt-1 mb-3">{data.greeting} 👋</p>

        {banner && <SuccessBanner banner={banner} data={data} />}

        <div className="mt-3 mb-4">
          <div className="text-[14px] text-text-secondary">{data.dateDisplay.weekday}</div>
          <div className="text-[28px] font-semibold tracking-[-0.025em]">{data.dateDisplay.full}</div>
        </div>

        <div className="bg-surface rounded-2xl shadow-card p-[22px]">
          <div className="text-[14px] text-text-secondary mb-2">Today&apos;s status</div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_DOT[data.status] }} />
            <span className="text-[22px] font-semibold tracking-[-0.02em]">{STATUS_LABEL(data)}</span>
          </div>

          {data.status === 'onLeave' && (
            <>
              <div className="mt-4 rounded-2xl border border-leave-border bg-leave-bg p-4">
                <div className="text-[13px] font-semibold text-leave-fg mb-1">Reason submitted</div>
                <div className="text-[15px] text-leave-body">{data.record.leaveReason}</div>
              </div>
              <div className="h-px bg-border my-4" />
              <div className="text-[13px] text-text-secondary">
                No further action today. Check-in reopens tomorrow at 12:00 am.
              </div>
            </>
          )}

          {data.status === 'checkedIn' && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="flex items-center gap-3">
                <img src={data.record.checkInPhoto} alt="Check-in" className="w-14 h-14 rounded-xl object-cover border border-border" />
                <div>
                  <div className="text-[15px] font-medium">Check-in photo</div>
                  <div className="text-[13px] text-text-tertiary font-mono">selfie · {data.record.checkInAtFmt}</div>
                </div>
              </div>
            </>
          )}

          {(data.status === 'none' || data.status === 'checkedOut') && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <Metric label="Classes today" value={data.classesToday} />
                <Metric label="Hours this month" value={data.monthHours} />
                <Metric label="Last check-out" value={data.lastCheckout || '—'} small />
              </div>
            </>
          )}
        </div>

        <div className="bg-surface rounded-2xl shadow-card p-[18px] mt-4">
          <div className="text-[14px] font-medium mb-3">Your teaching stats</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Classes till date" value={data.lifetimeClasses} />
            <Metric label="Hours till date" value={data.lifetimeHours} />
            <Metric label="Classes today" value={data.classesToday} />
          </div>
        </div>

        {data.status === 'onLeave' && (
          <div className="bg-surface rounded-2xl shadow-card p-[18px] mt-4">
            <div className="text-[14px] font-medium mb-3">This week</div>
            <div className="flex justify-between">
              {data.weekStrip.map((d) => (
                <WeekDot key={d.key} d={d} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {data.status === 'none' && (
            <Link
              href="/checkin"
              className="h-16 rounded-2xl bg-accent text-white text-[19px] font-semibold shadow-button-orange flex items-center justify-center gap-2.5"
            >
              <Circle size={16} strokeWidth={2.5} /> Check in
            </Link>
          )}
          {data.status === 'checkedIn' && (
            <Link
              href="/checkout"
              className="h-16 rounded-2xl bg-[#22252A] text-white text-[19px] font-semibold flex items-center justify-center gap-2.5"
            >
              <Square size={16} strokeWidth={2.5} /> Check out
            </Link>
          )}

          {data.status === 'none' && (
            <button
              onClick={() => setLeaveOpen(true)}
              className="h-[52px] rounded-2xl bg-white border border-border text-[16px] font-medium"
            >
              Mark leave for today
            </button>
          )}

          <div className="text-[13px] text-text-secondary text-center px-2">
            Check-in requires a photo. Leave can only be marked before your first check-in of the day.
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-surface border-t border-border px-[26px] pt-[14px] pb-[20px] flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold">{data.mentor.name}</div>
          <div className="text-[13px] text-text-secondary">Mentor · {data.university?.name}</div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-accent-tint text-accent-nav-ink text-[13px] font-semibold">
          {data.university?.code}
        </div>
      </footer>

      {leaveOpen && (
        <LeaveSheet
          dateLabel={`${data.dateDisplay.weekday}, ${data.dateDisplay.full}`}
          onClose={() => setLeaveOpen(false)}
        />
      )}
    </div>
  );
}

function Metric({ label, value, small }) {
  return (
    <div>
      <div className={`font-semibold ${small ? 'text-[15px]' : 'text-[18px]'}`}>{value}</div>
      <div className="text-[12px] text-text-secondary mt-0.5">{label}</div>
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
      <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-semibold ${cls} ${d.isToday ? 'ring-2 ring-accent' : ''}`}>
        {content}
      </div>
      <div className="text-[11px] text-text-tertiary">{d.label}</div>
    </div>
  );
}

function SuccessBanner({ banner, data }) {
  let title = '';
  let detail = '';
  if (banner === 'checkin') { title = `Checked in at ${data.record?.checkInAtFmt || ''}`; detail = 'Have a great session today.'; }
  if (banner === 'checkout') { title = `Checked out at ${data.record?.checkOutAtFmt || ''}`; detail = 'Today’s hours have been recorded.'; }
  if (banner === 'leave') { title = 'Leave recorded for today'; detail = 'Your coordinator can see the reason in the attendance log.'; }
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

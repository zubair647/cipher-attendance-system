'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from './Card';
import Pill from './Pill';
import AreaChart from './AreaChart';
import BarChart from './BarChart';

export default function ReportsClient({ data, selectedMentorId }) {
  const router = useRouter();
  const { mentor, mentors, lifetimeHours, presentDays, leaveDays, since, monthly, trend, range } = data;
  const [chartMode, setChartMode] = useState('line');
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  function push(next) {
    const merged = { mentor: selectedMentorId, from, to, ...next };
    const params = new URLSearchParams();
    if (merged.mentor) params.set('mentor', merged.mentor);
    if (merged.from) params.set('from', merged.from);
    if (merged.to) params.set('to', merged.to);
    router.push(`/reports${params.toString() ? `?${params}` : ''}`);
  }

  const maxMonth = Math.max(...monthly.map((m) => m.hours), 1);

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <select
          value={selectedMentorId}
          onChange={(e) => push({ mentor: e.target.value })}
          className="h-10 rounded-xl border-[1.5px] border-accent px-3 text-[14px] font-semibold"
        >
          {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); push({ from: e.target.value }); }} className="h-10 rounded-xl border border-border px-3 text-[14px]" />
        <span className="text-text-tertiary text-[13px]">to</span>
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); push({ to: e.target.value }); }} className="h-10 rounded-xl border border-border px-3 text-[14px]" />
      </div>

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        <Card>
          <div className="text-[14px] text-text-secondary mb-1">Lifetime hours logged</div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-[64px] font-bold tracking-[-0.035em] leading-none">{lifetimeHours}</span>
            <span className="text-[16px] text-text-secondary mb-2">hrs</span>
          </div>
          <div className="text-[13px] text-text-secondary mb-4">Since {since} · {presentDays} present days · {leaveDays} leave days</div>
          <div className="flex gap-2">
            <Pill variant="neutral">{mentor.universityCode}</Pill>
            <Pill variant={mentor.active ? 'present' : 'neutral'}>{mentor.active ? 'Active' : 'Inactive'}</Pill>
          </div>
        </Card>

        <Card>
          <div className="text-[14px] text-text-secondary mb-3">Per-month totals</div>
          <div className="flex flex-col gap-2.5">
            {monthly.length === 0 && <div className="text-[14px] text-text-tertiary">No months logged yet.</div>}
            {monthly.map((m, i) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-11 text-[13px] text-text-secondary">{m.label}</span>
                <div className="flex-1 h-3 rounded-full bg-border-soft overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(m.hours / maxMonth) * 100}%`, opacity: 0.45 + (0.55 * (i + 1)) / monthly.length }}
                  />
                </div>
                <span className="w-14 text-right text-[15px] font-semibold">{m.hours}</span>
              </div>
            ))}
          </div>
          <div className="text-[12px] text-text-tertiary mt-3">Most recent month is still in progress.</div>
        </Card>
      </div>

      <Card padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[16px] font-semibold">Weekly totals</div>
            <div className="text-[13px] text-text-secondary mt-0.5">{range.from} → {range.to}</div>
          </div>
          <div className="bg-canvas rounded-xl p-1 flex text-[13px] font-medium">
            {['line', 'bars'].map((m) => (
              <button key={m} onClick={() => setChartMode(m)} className={`px-3 h-8 rounded-lg capitalize ${chartMode === m ? 'bg-white shadow-sm' : 'text-text-secondary'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        {trend.length === 0 && <div className="text-[15px] text-text-secondary py-10 text-center">No attendance recorded in this range.</div>}
        {trend.length > 0 && (chartMode === 'line' ? <AreaChart data={trend} height={260} /> : <BarChart data={trend} height={260} />)}
      </Card>
    </div>
  );
}

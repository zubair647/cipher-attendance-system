import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Topbar from '../../components/Topbar';
import Card from '../../components/Card';
import Sparkline from '../../components/Sparkline';
import OverviewChart from '../../components/OverviewChart';
import { getOverviewData } from '../../lib/adminData';

export default function OverviewPage() {
  const data = getOverviewData();
  const chartHours = data.chart.map((d) => d.hours);

  return (
    <>
      <Topbar title="Overview" context={`${data.totalMentors} mentors · ${data.monthLabel} in progress`} />
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <div className="grid grid-cols-4 gap-[18px]">
          <Card>
            <div className="text-[14px] text-text-secondary mb-2">Active mentors</div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[38px] font-bold tracking-[-0.03em]">{data.activeMentors}</span>
                <span className="text-[14px] text-text-secondary ml-1.5">of {data.totalMentors}</span>
              </div>
              <Sparkline data={chartHours.slice(-10)} width={80} height={30} />
            </div>
          </Card>
          <Card>
            <div className="text-[14px] text-text-secondary mb-2">Hours logged in {data.monthLabel}</div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[38px] font-bold tracking-[-0.03em]">{data.hoursThisMonth}</span>
              </div>
              <Sparkline data={chartHours.slice(-10)} width={80} height={30} />
            </div>
          </Card>
          <Card>
            <div className="text-[14px] text-text-secondary mb-2">On leave today</div>
            <div className="text-[38px] font-bold tracking-[-0.03em] mb-2">{data.onLeaveToday.length}</div>
            <div className="flex flex-wrap gap-1.5">
              {data.onLeaveToday.length === 0 && <span className="text-[13px] text-text-tertiary">No one on leave today</span>}
              {data.onLeaveToday.slice(0, 3).map((m) => (
                <span key={m.id} className="px-2 py-1 rounded-full bg-leave-bg text-leave-fg text-[12px] font-medium">{m.name}</span>
              ))}
            </div>
          </Card>
          <Card className="border border-flagged-border">
            <div className="text-[14px] text-text-secondary mb-2">Missed check-outs</div>
            <div className="text-[38px] font-bold tracking-[-0.03em] text-flagged-fg mb-3">{data.flaggedCount}</div>
            <Link
              href="/attendance?flagged=1"
              className="inline-flex items-center h-[38px] px-3 rounded-lg bg-flagged-bg text-flagged-fg text-[13px] font-semibold"
            >
              Review flagged days
            </Link>
          </Card>
        </div>

        <div className="grid mt-[18px] gap-[18px]" style={{ gridTemplateColumns: '1.35fr 1fr' }}>
          <Card padding="p-6">
            <OverviewChart data={data.chart} />
          </Card>

          <Card padding="p-6">
            <div className="text-[16px] font-semibold mb-4">Needs attention</div>
            {data.flagged.length === 0 && (
              <div className="text-[15px] text-text-secondary mb-4">No flagged days right now — nice and tidy.</div>
            )}
            <div className="flex flex-col gap-2.5 mb-2">
              {data.flagged.map((f) => (
                <div key={f.id} className="rounded-xl border border-flagged-border bg-[#FDF6F6] px-3.5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-semibold">{f.mentorName} · {f.universityCode}</div>
                    <div className="text-[13px] text-text-secondary mt-0.5">
                      {f.date} · checked in {f.checkInAtFmt}, no check-out
                    </div>
                  </div>
                  <Link href={`/attendance?mentor=${f.mentorId}`} className="text-[13px] font-semibold text-accent-ink shrink-0">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
            <div className="h-px bg-border-soft my-3" />
            <div className="flex flex-col">
              <JumpRow href="/mentors" label="Manage mentor accounts" />
              <JumpRow href="/timetables" label="Update a timetable" />
              <JumpRow href="/reports" label="View hours reports" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function JumpRow({ href, label }) {
  return (
    <Link href={href} className="h-11 flex items-center justify-between text-[14px] text-text-primary hover:text-accent-ink">
      {label}
      <ArrowRight size={16} />
    </Link>
  );
}

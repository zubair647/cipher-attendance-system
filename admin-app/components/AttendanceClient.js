'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from './Card';
import Pill from './Pill';
import CorrectionModal from './CorrectionModal';
import PhotoPreviewModal from './PhotoPreviewModal';

export default function AttendanceClient({ data, filters, onlyFlaggedInitial }) {
  const router = useRouter();
  const { rows, stats, mentors, universities } = data;
  const [mentorId, setMentorId] = useState(filters.mentorId);
  const [universityId, setUniversityId] = useState(filters.universityId);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);
  const [onlyFlagged, setOnlyFlagged] = useState(onlyFlaggedInitial);
  const [editRow, setEditRow] = useState(null);
  const [photo, setPhoto] = useState(null);

  function applyFilters(next) {
    const merged = { mentorId, universityId, from, to, ...next };
    const params = new URLSearchParams();
    if (merged.mentorId) params.set('mentor', merged.mentorId);
    if (merged.universityId) params.set('university', merged.universityId);
    if (merged.from) params.set('from', merged.from);
    if (merged.to) params.set('to', merged.to);
    router.push(`/attendance${params.toString() ? `?${params}` : ''}`);
  }

  const visibleRows = useMemo(
    () => (onlyFlagged ? rows.filter((r) => r.status === 'flagged') : rows),
    [rows, onlyFlagged]
  );

  function exportCsv() {
    const header = ['Date', 'Mentor', 'University', 'Check-in', 'Check-out', 'Hours', 'Status', 'Leave reason'];
    const lines = [header.join(',')];
    visibleRows.forEach((r) => {
      lines.push([
        r.date, csv(r.mentorName), r.universityCode || '', r.checkInAtFmt || '', r.checkOutAtFmt || '',
        r.status === 'present' ? r.hours : '', r.status, csv(r.leaveReason || ''),
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance-log.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function csv(v) { return `"${String(v).replace(/"/g, '""')}"`; }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <select value={mentorId} onChange={(e) => { setMentorId(e.target.value); applyFilters({ mentorId: e.target.value }); }} className="h-10 rounded-xl border border-border px-3 text-[14px]">
          <option value="">All mentors</option>
          {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={universityId} onChange={(e) => { setUniversityId(e.target.value); applyFilters({ universityId: e.target.value }); }} className="h-10 rounded-xl border border-border px-3 text-[14px]">
          <option value="">All universities</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); applyFilters({ from: e.target.value }); }} className="h-10 rounded-xl border border-border px-3 text-[14px]" />
        <span className="text-text-tertiary text-[13px]">to</span>
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); applyFilters({ to: e.target.value }); }} className="h-10 rounded-xl border border-border px-3 text-[14px]" />
        {onlyFlagged && (
          <button onClick={() => setOnlyFlagged(false)} className="h-10 px-3 rounded-xl bg-flagged-bg text-flagged-fg text-[13px] font-semibold">
            Flagged only ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <Stat label="Days present" value={stats.daysPresent} />
        <Stat label="Hours in range" value={stats.hoursInRange} />
        <Stat label="Leave days" value={stats.leaveDays} />
        <Stat label="Flagged" value={stats.flagged} flagged />
      </div>

      <Card padding="p-0">
        <div className="grid px-6 py-3.5 border-b border-border text-[13px] text-text-secondary font-medium" style={{ gridTemplateColumns: '1fr 1.3fr 1.3fr .8fr 1.5fr .7fr', gap: 14 }}>
          <span>Date</span><span>Check-in</span><span>Check-out</span><span>Hours</span><span>Status</span><span className="text-right">Edit</span>
        </div>
        {visibleRows.length === 0 && <div className="px-6 py-10 text-center text-[15px] text-text-secondary">No attendance recorded in this range.</div>}
        <div className="max-h-[560px] overflow-y-auto">
          {visibleRows.map((r) => (
            <div key={r.id} className="grid px-6 py-3.5 border-b border-border-soft items-center hover:bg-[#FAFBFC]" style={{ gridTemplateColumns: '1fr 1.3fr 1.3fr .8fr 1.5fr .7fr', gap: 14 }}>
              <div>
                <div className="text-[15px] font-semibold">{shortDate(r.date)}</div>
                <div className="text-[12px] text-text-tertiary">{r.mentorName}</div>
              </div>
              <Thumb photo={r.checkInPhoto} time={r.checkInAtFmt} leave={r.status === 'leave'} onClick={() => r.checkInPhoto && setPhoto({ photo: r.checkInPhoto, label: `Check-in photo · ${shortDate(r.date)}, ${r.checkInAtFmt}`, mentorName: r.mentorName })} />
              <Thumb
                photo={r.checkOutPhoto} time={r.status === 'flagged' ? '—' : r.status === 'in_progress' ? 'in progress' : r.checkOutAtFmt}
                leave={r.status === 'leave'} missing={r.status === 'flagged'}
                onClick={() => r.checkOutPhoto && setPhoto({ photo: r.checkOutPhoto, label: `Check-out photo · ${shortDate(r.date)}, ${r.checkOutAtFmt}`, mentorName: r.mentorName })}
              />
              <span className="text-[15px] font-semibold">{r.status === 'present' ? r.hours : '—'}</span>
              <StatusPill row={r} />
              <div className="text-right">
                <button onClick={() => setEditRow(r)} className="text-[13px] font-semibold text-accent-ink">Edit</button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 flex items-center justify-between border-t border-border-soft">
          <span className="text-[13px] text-text-secondary">Hours are computed from the mentor&apos;s timetable. Flagged rows are excluded until corrected.</span>
          <button onClick={exportCsv} className="text-[13px] font-semibold text-accent-ink">Export CSV</button>
        </div>
      </Card>

      {editRow && <CorrectionModal row={editRow} onClose={() => setEditRow(null)} />}
      {photo && <PhotoPreviewModal {...photo} onClose={() => setPhoto(null)} />}
    </div>
  );
}

function Stat({ label, value, flagged }) {
  return (
    <Card padding="p-4" className={flagged ? 'border border-flagged-border' : ''}>
      <div className="text-[13px] text-text-secondary mb-1.5">{label}</div>
      <div className={`text-[26px] font-bold tracking-[-0.025em] ${flagged ? 'text-flagged-fg' : ''}`}>{value}</div>
    </Card>
  );
}

function Thumb({ photo, time, leave, missing, onClick }) {
  if (leave) return <span className="text-[14px] text-text-tertiary">—</span>;
  return (
    <button onClick={onClick} disabled={!photo} className="flex items-center gap-2.5 text-left disabled:cursor-default">
      {photo ? (
        <img src={photo} alt="" className="w-[34px] h-[34px] rounded-[9px] object-cover border border-border" />
      ) : (
        <span className="w-[34px] h-[34px] rounded-[9px] bg-canvas border border-border" />
      )}
      <span className={`text-[15px] ${missing ? 'text-flagged-fg font-semibold' : ''}`}>{time || '—'}</span>
    </button>
  );
}

function StatusPill({ row }) {
  if (row.status === 'present') return <Pill variant="present">Present</Pill>;
  if (row.status === 'leave') return <Pill variant="leave">Leave · {row.leaveReason}</Pill>;
  if (row.status === 'flagged') return <Pill variant="flagged">Flagged</Pill>;
  if (row.status === 'in_progress') return <Pill variant="neutral">In progress</Pill>;
  return <Pill variant="neutral">—</Pill>;
}

function shortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

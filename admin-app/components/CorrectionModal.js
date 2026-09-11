'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import Modal from './Modal';

export default function CorrectionModal({ row, onClose }) {
  const router = useRouter();
  const [checkInTime, setCheckInTime] = useState(row.checkInTimeValue || '');
  const [checkOutTime, setCheckOutTime] = useState(row.checkOutTimeValue || '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/attendance/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInTime, checkOutTime, note }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Could not save correction.'); setLoading(false); return; }
    onClose();
    router.refresh();
  }

  return (
    <Modal width={560} onClose={onClose}>
      <div className="px-6 pt-6 pb-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[20px] font-bold tracking-[-0.015em]">Correct attendance</div>
            <div className="text-[13px] text-text-secondary mt-1">{row.mentorName} · {row.date} · {row.status}</div>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={20} /></button>
        </div>

        {row.status === 'flagged' && (
          <div className="mt-4 rounded-xl bg-flagged-bg border border-flagged-border p-3.5 text-[14px] text-flagged-banner-text">
            Check-out photo is missing. Enter the time manually — the correction is recorded with your name.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-[13px] text-text-secondary mb-1.5">Check-in</label>
            <input
              type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full h-[46px] rounded-xl border border-border px-3 text-[15px] outline-none focus:border-[1.5px] focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[13px] text-text-secondary mb-1.5">Check-out</label>
            <input
              type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full h-[46px] rounded-xl border border-border px-3 text-[15px] outline-none focus:border-[1.5px] focus:border-accent"
            />
          </div>
        </div>

        <label className="block text-[13px] text-text-secondary mb-1.5 mt-4">Note (optional)</label>
        <input
          value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full h-[46px] rounded-xl border border-border px-3 text-[15px] outline-none focus:border-[1.5px] focus:border-accent"
          placeholder="e.g. Confirmed with mentor over call"
        />

        {error && <div className="text-[13px] text-flagged-fg mt-3">{error}</div>}

        <div className="flex items-center justify-between mt-6">
          <div className="text-[14px] text-text-secondary">
            Computed hours <span className="font-bold text-text-primary">{row.scheduledHours}</span>
            <span className="text-[12px] text-text-tertiary block">from {row.mentorName?.split(' ')[0]}&apos;s timetable for this day</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="h-11 px-4 rounded-xl border border-border text-[14px] font-medium">Cancel</button>
            <button onClick={save} disabled={loading} className="h-11 px-4 rounded-xl bg-accent text-white text-[14px] font-semibold shadow-button-orange disabled:opacity-60">
              {loading ? 'Saving…' : 'Save correction'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

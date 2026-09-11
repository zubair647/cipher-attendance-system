'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveSheet({ dateLabel, onClose }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    const trimmed = reason.trim();
    if (trimmed.length < 1) {
      setError('Please enter a reason.');
      return;
    }
    if (trimmed.length > 280) {
      setError('Keep it under 280 characters.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: trimmed }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not submit leave.');
      setLoading(false);
      return;
    }
    router.push('/?banner=leave');
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-[rgba(26,28,32,0.35)]" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-surface rounded-t-[28px] px-5 pt-3 pb-[30px] shadow-sheet">
        <div className="w-11 h-[5px] rounded-full bg-border mx-auto mb-4" />
        <div className="text-[22px] font-semibold tracking-[-0.02em]">Mark leave</div>
        <div className="text-[14px] text-text-secondary mt-1 mb-5">
          {dateLabel} · this replaces today&apos;s check-in.
        </div>

        <label className="block text-[14px] text-text-secondary mb-1.5">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full min-h-[104px] rounded-2xl bg-canvas p-4 text-[16px] outline-none focus:border-[1.5px] focus:border-accent border border-transparent resize-none"
          placeholder="e.g. Family emergency"
        />
        <div className="text-[13px] text-text-secondary mt-1.5">
          Visible to the CipherSchools ops team in the attendance log.
        </div>
        {error && <div className="text-[13px] text-flagged-fg mt-2">{error}</div>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="w-[118px] h-14 rounded-2xl border border-border bg-white font-medium text-[15px]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 h-14 rounded-2xl bg-accent text-white font-semibold text-[16px] shadow-button-orange disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit leave'}
          </button>
        </div>
      </div>
    </div>
  );
}

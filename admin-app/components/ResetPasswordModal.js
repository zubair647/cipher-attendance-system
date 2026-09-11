'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import Modal from './Modal';

export default function ResetPasswordModal({ mentor, onClose }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch(`/api/mentors/${mentor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Could not reset password.'); setLoading(false); return; }
    setDone(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <Modal width={420} onClose={onClose}>
      <div className="px-6 pt-6 pb-6">
        <div className="flex items-start justify-between mb-1">
          <div className="text-[18px] font-semibold">Reset password</div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="text-[13px] text-text-secondary mb-4">{mentor.name} · {mentor.email}</div>

        {done ? (
          <div className="text-[14px] text-present-fg bg-present-bg border border-present-border rounded-xl p-3">
            Password updated. Share the new password with the mentor directly.
          </div>
        ) : (
          <>
            <label className="block text-[13px] text-text-secondary mb-1.5">New password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border border-border px-3 text-[14px] outline-none focus:border-[1.5px] focus:border-accent"
              placeholder="Min. 8 characters"
            />
            {error && <div className="text-[13px] text-flagged-fg mt-2">{error}</div>}
            <div className="flex justify-end gap-2.5 mt-4">
              <button onClick={onClose} className="h-10 px-4 rounded-xl border border-border text-[13px] font-medium">Cancel</button>
              <button onClick={submit} disabled={loading} className="h-10 px-4 rounded-xl bg-accent text-white text-[13px] font-semibold disabled:opacity-60">
                {loading ? 'Saving…' : 'Save new password'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

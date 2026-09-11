'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import Modal from './Modal';

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AddMentorModal({ universities, onClose }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [universityId, setUniversityId] = useState(universities[0]?.id || '');
  const [password, setPassword] = useState(randomPassword());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function submit() {
    setLoading(true);
    setFormError('');
    setErrors({});
    const res = await fetch('/api/mentors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, universityId, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || 'Could not create mentor.');
      setErrors(data.fields || {});
      setLoading(false);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal width={560} onClose={onClose}>
      <div className="px-7 pt-7 pb-2 flex items-start justify-between">
        <div>
          <div className="text-[22px] font-bold tracking-[-0.015em]">Add mentor</div>
          <div className="text-[14px] text-text-secondary mt-1">Credentials are issued here and shared with the mentor directly.</div>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={20} /></button>
      </div>

      <div className="px-7 pb-7 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name" error={errors.name}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls(errors.name)} placeholder="Aditi Sharma" />
          </Field>
          <Field label="University" error={errors.universityId}>
            <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className={inputCls(errors.universityId)}>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Email (login identifier)" error={errors.email}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls(errors.email)} placeholder="mentor@cipherschools.com" />
            </Field>
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[14px] text-text-secondary">Temporary password</label>
              <button type="button" onClick={() => setPassword(randomPassword())} className="text-[13px] font-medium text-accent-ink">Generate</button>
            </div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls(errors.password)} />
            {errors.password && <div className="text-[13px] text-flagged-fg mt-1">{errors.password}</div>}
          </div>
        </div>

        <div className="bg-canvas rounded-xl p-3.5 text-[13px] text-text-secondary mt-4">
          The mentor&apos;s timetable can be set right after the account is created.
        </div>
        {formError && <div className="text-[13px] text-flagged-fg mt-3">{formError}</div>}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="h-[46px] px-5 rounded-2xl border border-border font-medium text-[15px]">Cancel</button>
          <button onClick={submit} disabled={loading} className="h-[46px] px-5 rounded-2xl bg-accent text-white font-semibold text-[15px] shadow-button-orange disabled:opacity-60">
            {loading ? 'Creating…' : 'Create mentor'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[14px] text-text-secondary mb-1.5">{label}</label>
      {children}
      {error && <div className="text-[13px] text-flagged-fg mt-1">{error}</div>}
    </div>
  );
}
function inputCls(error) {
  return `w-full h-[46px] rounded-2xl border px-3.5 text-[15px] outline-none focus:border-[1.5px] focus:border-accent ${error ? 'border-flagged-fg' : 'border-border'}`;
}

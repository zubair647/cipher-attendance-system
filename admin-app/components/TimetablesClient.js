'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from './Card';
import Pill from './Pill';

const DAYS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TimetablesClient({ data, selectedMentorId }) {
  const router = useRouter();
  const { mentor, mentors, active, history } = data;
  const [form, setForm] = useState(() => ({
    mon: active?.mon ?? 0, tue: active?.tue ?? 0, wed: active?.wed ?? 0, thu: active?.thu ?? 0, fri: active?.fri ?? 0,
    effectiveFrom: todayStr(),
    attachmentName: '',
  }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function changeMentor(id) {
    router.push(`/timetables?mentor=${id}`);
  }

  function setDay(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/timetables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: selectedMentorId, ...form }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error || 'Could not save.'); setLoading(false); return; }
    setLoading(false);
    router.refresh();
  }

  const totalWeek = active ? DAYS.reduce((s, d) => s + Number(active[d.key] || 0), 0) : 0;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-[13px] text-text-secondary">Mentor</span>
        <select
          value={selectedMentorId}
          onChange={(e) => changeMentor(e.target.value)}
          className="h-10 rounded-xl border border-border px-3 text-[14px]"
        >
          {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1.15fr 400px' }}>
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[15px] font-semibold">
                {active ? `Effective from ${active.effectiveFrom} · ${totalWeek} classes per week` : 'No timetable set yet'}
              </div>
              {active && <Pill variant="present">Current version</Pill>}
            </div>
            <div className="grid grid-cols-5 gap-3.5">
              {DAYS.map((d) => (
                <div key={d.key} className="rounded-xl border border-border bg-canvas p-4 text-center">
                  <div className="text-[13px] text-text-secondary mb-1">{d.label}</div>
                  <div className="text-[30px] font-bold tracking-[-0.025em]">{active ? active[d.key] : '—'}</div>
                  <div className="text-[12px] text-text-tertiary">classes</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex-1">
            <div className="text-[15px] font-semibold mb-1">Version history</div>
            <div className="text-[13px] text-text-secondary mb-4">Read-only. Updating creates a new version instead of overwriting.</div>
            {history.length === 0 && <div className="text-[14px] text-text-tertiary">No earlier versions.</div>}
            <div className="flex flex-col gap-2">
              {history.map((v) => (
                <div key={v.id} className="rounded-xl bg-[#FAFBFC] p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[15px] font-semibold">{v.effectiveFrom} → {v.effectiveTo || 'present'}</div>
                    <div className="text-[12px] font-mono text-text-tertiary">{v.attachmentName || 'no attachment'}</div>
                  </div>
                  <div className="text-[13px] text-text-secondary mt-0.5">
                    {DAYS.map((d) => `${d.label} ${v[d.key]}`).join(' · ')} — {DAYS.reduce((s, d) => s + Number(v[d.key] || 0), 0)} classes
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <div className="text-[15px] font-semibold mb-4">Update timetable</div>
          <div className="text-[13px] text-text-secondary mb-1.5">Classes per day</div>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {DAYS.map((d) => (
              <div key={d.key}>
                <div className="text-[12px] text-text-tertiary text-center mb-1">{d.label}</div>
                <input
                  type="number" min={0} max={12}
                  value={form[d.key]}
                  onChange={(e) => setDay(d.key, Number(e.target.value))}
                  className="w-full h-[52px] rounded-xl border border-border text-center text-[16px] outline-none focus:border-[1.5px] focus:border-accent"
                />
              </div>
            ))}
          </div>

          <label className="block text-[13px] text-text-secondary mb-1.5">Effective from</label>
          <input
            type="date"
            value={form.effectiveFrom}
            min={todayStr()}
            onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
            className="w-full h-12 rounded-xl border border-border px-3 text-[15px] mb-4 outline-none focus:border-[1.5px] focus:border-accent"
          />

          <label className="block text-[13px] text-text-secondary mb-1.5">Reference file (optional)</label>
          <label className="block rounded-xl border-[1.5px] border-dashed border-border p-4 text-center cursor-pointer mb-1">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setForm((f) => ({ ...f, attachmentName: e.target.files?.[0]?.name || '' }))}
            />
            <div className="text-[14px] text-text-secondary">
              {form.attachmentName || 'Drop the original CSV or photo'}
            </div>
          </label>
          <div className="text-[12px] font-mono text-text-tertiary mb-5">stored for reference · not parsed</div>

          {error && <div className="text-[13px] text-flagged-fg mb-3">{error}</div>}

          <button onClick={save} disabled={loading} className="w-full h-12 rounded-xl bg-accent text-white font-semibold text-[15px] shadow-button-orange mb-2 disabled:opacity-60">
            {loading ? 'Saving…' : 'Save as new version'}
          </button>
        </Card>
      </div>
    </div>
  );
}

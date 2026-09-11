'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import Card from './Card';
import Toggle from './Toggle';
import AddMentorModal from './AddMentorModal';
import ResetPasswordModal from './ResetPasswordModal';

const PAGE_SIZE = 8;

export default function MentorsClient({ mentors, universities, initialQuery, initialUniversity }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [uni, setUni] = useState(initialUniversity);
  const [addOpen, setAddOpen] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [page, setPage] = useState(0);

  function applyFilters(nextQ, nextUni) {
    const params = new URLSearchParams();
    if (nextQ) params.set('q', nextQ);
    if (nextUni) params.set('university', nextUni);
    router.push(`/mentors${params.toString() ? `?${params}` : ''}`);
  }

  async function toggleActive(mentor, next) {
    await fetch(`/api/mentors/${mentor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: next }),
    });
    router.refresh();
  }

  const pageStart = page * PAGE_SIZE;
  const pageRows = mentors.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters(q, uni)}
              onBlur={() => applyFilters(q, uni)}
              placeholder="Search by name or email"
              className="w-[280px] h-10 rounded-xl border border-border pl-9 pr-3 text-[14px] outline-none focus:border-[1.5px] focus:border-accent"
            />
          </div>
          <select
            value={uni}
            onChange={(e) => { setUni(e.target.value); applyFilters(q, e.target.value); }}
            className="h-10 rounded-xl border border-border px-3 text-[14px] outline-none"
          >
            <option value="">University: all</option>
            {universities.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
          </select>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="h-10 px-4 rounded-xl bg-accent text-white text-[14px] font-semibold shadow-button-orange flex items-center gap-1.5"
        >
          <Plus size={16} /> Add mentor
        </button>
      </div>

      <Card padding="p-0">
        <div className="grid px-6 py-4 border-b border-border text-[13px] text-text-secondary font-medium" style={{ gridTemplateColumns: '1.4fr 1.6fr .8fr 1fr 1.5fr', gap: 16 }}>
          <span>Name</span><span>Email</span><span>University</span><span>Status</span><span className="text-right">Actions</span>
        </div>
        {pageRows.length === 0 && (
          <div className="px-6 py-10 text-center text-[15px] text-text-secondary">No mentors match these filters.</div>
        )}
        {pageRows.map((m) => (
          <div key={m.id} className="grid px-6 py-4.5 border-b border-border-soft items-center hover:bg-[#FAFBFC]" style={{ gridTemplateColumns: '1.4fr 1.6fr .8fr 1fr 1.5fr', gap: 16, paddingTop: 18, paddingBottom: 18 }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#22252A] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                {m.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <span className="text-[15px] font-semibold truncate">{m.name}</span>
            </div>
            <span className="text-[14px] text-text-secondary truncate">{m.email}</span>
            <span className="inline-flex w-fit px-2.5 py-1 rounded-lg bg-canvas border border-border text-[13px] font-semibold">{m.universityCode}</span>
            <div className="flex items-center gap-2.5">
              <Toggle checked={m.active} onChange={(v) => toggleActive(m, v)} />
              <span className="text-[13px] text-text-secondary">{m.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex items-center justify-end gap-4">
              <button onClick={() => setResetFor(m)} className="text-[13px] font-semibold text-accent-ink">Reset password</button>
              <Link href={`/timetables?mentor=${m.id}`} className="text-[13px] font-semibold text-text-body-alt">Timetable</Link>
            </div>
          </div>
        ))}
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-[13px] text-text-secondary">
            Showing {mentors.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, mentors.length)} of {mentors.length}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-9 px-3 rounded-[10px] border border-border text-[13px] disabled:opacity-40">Previous</button>
            <button disabled={pageStart + PAGE_SIZE >= mentors.length} onClick={() => setPage((p) => p + 1)} className="h-9 px-3 rounded-[10px] border border-border text-[13px] disabled:opacity-40">Next</button>
          </div>
        </div>
      </Card>

      {addOpen && <AddMentorModal universities={universities} onClose={() => setAddOpen(false)} />}
      {resetFor && <ResetPasswordModal mentor={resetFor} onClose={() => setResetFor(null)} />}
    </div>
  );
}

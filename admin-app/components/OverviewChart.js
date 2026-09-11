'use client';
import { useState } from 'react';
import AreaChart from './AreaChart';

export default function OverviewChart({ data }) {
  const [range, setRange] = useState(12);
  const sliced = data.slice(-range).map((d) => ({ ...d, label: shortLabel(d.date) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[16px] font-semibold">Hours logged per day</div>
          <div className="text-[13px] text-text-secondary mt-0.5">Across all mentors, LPU and GU combined</div>
        </div>
        <div className="bg-canvas rounded-xl p-1 flex text-[13px] font-medium">
          {[12, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 h-8 rounded-lg ${range === r ? 'bg-white shadow-sm' : 'text-text-secondary'}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <AreaChart data={sliced} />
    </div>
  );
}

function shortLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

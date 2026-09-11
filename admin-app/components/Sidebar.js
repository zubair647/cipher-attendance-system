'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Users, CalendarDays, ClipboardList, BarChart3 } from 'lucide-react';
import Logo from './Logo';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/mentors', label: 'Mentors', icon: Users },
  { href: '/timetables', label: 'Timetables', icon: CalendarDays },
  { href: '/attendance', label: 'Attendance log', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ admin }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-[248px] shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="px-6 pt-6 pb-4 flex items-center gap-2.5">
        <Logo size={26} borderWidth={3} />
        <span className="text-[16px] font-semibold">CipherSchools</span>
      </div>
      <nav className="px-4 flex flex-col gap-1 mt-2">
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`h-[42px] rounded-xl px-3 flex items-center gap-2.5 text-[15px] ${
                active ? 'bg-accent-tint text-accent-nav-ink font-semibold' : 'text-text-body-alt font-normal hover:bg-canvas'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border p-3.5 flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-[#22252A] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
          OP
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold truncate">{admin?.name || 'Ops admin'}</div>
          <div className="text-[12px] text-text-secondary truncate">{admin?.email}</div>
        </div>
        <button onClick={logout} title="Log out" className="text-[12px] text-accent-ink font-medium shrink-0">
          Log out
        </button>
      </div>
    </aside>
  );
}

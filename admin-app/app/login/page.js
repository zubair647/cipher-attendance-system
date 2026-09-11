import { getOverviewData } from '../../lib/adminData';
import LoginForm from '../../components/LoginForm';
import Sparkline from '../../components/Sparkline';
import Logo from '../../components/Logo';

export default function AdminLoginPage() {
  const overview = getOverviewData();
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-2.5 mb-8">
            <Logo size={30} borderWidth={3} />
            <span className="text-[16px] font-semibold">CipherSchools</span>
          </div>
          <div className="text-[32px] font-bold tracking-[-0.015em] mb-1.5">Admin sign in</div>
          <p className="text-[15px] text-text-secondary mb-6">Attendance and hours for mentors at LPU and GU.</p>

          <div className="bg-surface rounded-2xl shadow-card p-7">
            <LoginForm />
          </div>
          <p className="text-[13px] text-text-secondary mt-6">
            Issued to CipherSchools operations staff only.
          </p>
        </div>
      </div>

      <div className="w-[560px] shrink-0 bg-surface border-l border-border p-16 hidden lg:flex flex-col justify-center">
        <div className="text-[14px] text-text-secondary mb-2">This month at a glance</div>
        <div className="flex items-end gap-3 mb-1">
          <span className="text-[52px] font-bold tracking-[-0.03em] leading-none">{overview.hoursThisMonth}</span>
          <span className="text-[16px] text-text-secondary mb-2">hours logged</span>
        </div>
        <div className="mt-2 mb-6">
          <Sparkline data={overview.chart.slice(-14).map((d) => d.hours)} width={280} height={56} />
        </div>
        <p className="text-[15px] text-text-secondary leading-[1.6]">
          {overview.activeMentors} active mentors across LPU and GU checked in this month, with{' '}
          {overview.flaggedCount} day{overview.flaggedCount === 1 ? '' : 's'} still waiting on a correction.
        </p>
      </div>
    </div>
  );
}

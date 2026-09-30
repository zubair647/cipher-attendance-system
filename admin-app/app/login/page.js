import LoginForm from '../../components/LoginForm';
import Logo from '../../components/Logo';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-2.5 mb-8">
            <Logo size={30} />
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
        <div className="text-[14px] text-text-secondary mb-2">CipherSchools operations</div>
        <div className="text-[28px] font-bold tracking-[-0.02em] leading-snug mb-3">
          Mentor attendance &amp; teaching hours, in one place.
        </div>
        <p className="text-[15px] text-text-secondary leading-[1.6]">
          Manage mentor accounts and timetables, review daily attendance with photo proof,
          correct missed check-outs, and track hours across LPU and GU.
        </p>
      </div>
    </div>
  );
}

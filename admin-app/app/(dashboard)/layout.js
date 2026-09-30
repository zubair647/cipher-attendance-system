import { getAdmin } from '../../lib/session';
import Sidebar from '../../components/Sidebar';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }) {
  const admin = getAdmin();
  return (
    <div className="flex h-screen min-w-[1280px] overflow-hidden">
      <Sidebar admin={admin} />
      <div className="flex-1 flex flex-col overflow-hidden bg-canvas">{children}</div>
    </div>
  );
}

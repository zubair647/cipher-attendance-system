import { readDb } from '@cipher/shared';
import { getSessionAdminId } from '../../lib/session';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children }) {
  const adminId = getSessionAdminId();
  const db = readDb();
  const admin = db.admins.find((a) => a.id === adminId) || null;

  return (
    <div className="flex h-screen min-w-[1280px] overflow-hidden">
      <Sidebar admin={admin} />
      <div className="flex-1 flex flex-col overflow-hidden bg-canvas">{children}</div>
    </div>
  );
}

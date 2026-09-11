import { readDb } from '@cipher/shared';
import Topbar from '../../../components/Topbar';
import ReportsClient from '../../../components/ReportsClient';
import { getReportsData } from '../../../lib/adminData';

export default function ReportsPage({ searchParams }) {
  const db = readDb();
  const mentorId = searchParams?.mentor || db.mentors[0]?.id;
  const from = searchParams?.from || '';
  const to = searchParams?.to || '';
  const data = mentorId ? getReportsData({ mentorId, from, to }) : null;

  if (!data) {
    return (
      <>
        <Topbar title="Reports" />
        <div className="flex-1 flex items-center justify-center text-text-secondary text-[15px]">Add a mentor first to see reports.</div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Reports" context={`${data.mentor.name} · ${data.mentor.universityName}`} />
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <ReportsClient data={data} selectedMentorId={mentorId} />
      </div>
    </>
  );
}

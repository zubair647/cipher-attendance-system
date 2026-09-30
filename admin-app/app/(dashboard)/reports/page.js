import Topbar from '../../../components/Topbar';
import ReportsClient from '../../../components/ReportsClient';
import { getReportsData } from '../../../lib/adminData';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ searchParams }) {
  const from = searchParams?.from || '';
  const to = searchParams?.to || '';
  const data = await getReportsData({ mentorId: searchParams?.mentor || null, from, to });

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
        <ReportsClient data={data} selectedMentorId={data.mentor.id} />
      </div>
    </>
  );
}

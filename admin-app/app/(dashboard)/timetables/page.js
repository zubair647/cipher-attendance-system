import Topbar from '../../../components/Topbar';
import TimetablesClient from '../../../components/TimetablesClient';
import { getTimetableData } from '../../../lib/adminData';

export const dynamic = 'force-dynamic';

export default async function TimetablesPage({ searchParams }) {
  const data = await getTimetableData(searchParams?.mentor || null);

  if (!data) {
    return (
      <>
        <Topbar title="Timetables" />
        <div className="flex-1 flex items-center justify-center text-text-secondary text-[15px]">
          Add a mentor first, then set their timetable here.
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title={`Timetable · ${data.mentor.name}`} context={`${data.mentor.universityName} · ${data.active ? `active since ${data.active.effectiveFrom}` : 'no timetable set yet'}`} />
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <TimetablesClient data={data} selectedMentorId={data.mentor.id} />
      </div>
    </>
  );
}

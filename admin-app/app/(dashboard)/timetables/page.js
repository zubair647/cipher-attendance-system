import { readDb } from '@cipher/shared';
import Topbar from '../../../components/Topbar';
import TimetablesClient from '../../../components/TimetablesClient';
import { getTimetableData } from '../../../lib/adminData';

export default function TimetablesPage({ searchParams }) {
  const db = readDb();
  const mentorId = searchParams?.mentor || db.mentors[0]?.id;
  const data = mentorId ? getTimetableData(mentorId) : null;

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
        <TimetablesClient data={data} selectedMentorId={mentorId} />
      </div>
    </>
  );
}

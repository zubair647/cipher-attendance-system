import Topbar from '../../../components/Topbar';
import { getAttendanceLog } from '../../../lib/adminData';
import AttendanceClient from '../../../components/AttendanceClient';

export default function AttendancePage({ searchParams }) {
  const mentorId = searchParams?.mentor || '';
  const universityId = searchParams?.university || '';
  const from = searchParams?.from || '';
  const to = searchParams?.to || '';
  const onlyFlagged = searchParams?.flagged === '1';

  const data = getAttendanceLog({ mentorId, universityId, from, to });
  const mentorName = mentorId ? data.mentors.find((m) => m.id === mentorId)?.name : 'All mentors';

  return (
    <>
      <Topbar title="Attendance log" context={`${mentorName} · ${from || 'all time'} ${to ? `→ ${to}` : ''}`} />
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <AttendanceClient
          data={data}
          filters={{ mentorId, universityId, from, to }}
          onlyFlaggedInitial={onlyFlagged}
        />
      </div>
    </>
  );
}

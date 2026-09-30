import Topbar from '../../../components/Topbar';
import { getMentorsList } from '../../../lib/adminData';
import MentorsClient from '../../../components/MentorsClient';

export const dynamic = 'force-dynamic';

export default async function MentorsPage({ searchParams }) {
  const q = searchParams?.q || '';
  const universityId = searchParams?.university || '';
  const { mentors, universities, total } = await getMentorsList({ query: q, universityId });
  const countsByUni = universities.map((u) => ({
    ...u,
    count: mentors.filter((m) => String(m.university) === u.id).length,
  }));

  return (
    <>
      <Topbar title="Mentors" context={`${total} accounts · ${countsByUni.map((u) => `${u.code} ${u.count}`).join(' · ')}`} />
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <MentorsClient mentors={mentors} universities={universities} initialQuery={q} initialUniversity={universityId} />
      </div>
    </>
  );
}

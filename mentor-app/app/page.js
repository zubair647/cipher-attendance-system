import { getSessionMentorId } from '../lib/session';
import { getMentorHomeData } from '../lib/mentorData';
import HomeClient from '../components/HomeClient';

export default function HomePage({ searchParams }) {
  const mentorId = getSessionMentorId();
  const data = getMentorHomeData(mentorId);
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-text-secondary">
        Your account could not be found. Please contact your coordinator.
      </div>
    );
  }
  return <HomeClient data={data} banner={searchParams?.banner || null} />;
}

import { getSession } from '../lib/session';
import { getMentorHomeData } from '../lib/mentorData';
import HomeClient from '../components/HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const session = getSession();
  const data = await getMentorHomeData(session);

  if (!data || data.error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-text-secondary">
        {data?.error
          ? `Couldn’t load your data: ${data.error}`
          : 'Your account could not be found. Please contact your coordinator.'}
      </div>
    );
  }
  return <HomeClient data={data} banner={searchParams?.banner || null} />;
}

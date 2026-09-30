import { getSession } from '../lib/session';
import HomeShell from '../components/HomeShell';

export const dynamic = 'force-dynamic';

export default function HomePage({ searchParams }) {
  const session = getSession();
  // getSession only reads the cookie (instant, no backend), so the shell paints
  // immediately. HomeShell fetches the live data itself and fills it in.
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-text-secondary">
        Please log in again.
      </div>
    );
  }
  return (
    <HomeShell
      session={{ mentor_id: session.mentor_id, name: session.name, email: session.email, university: session.university }}
      banner={searchParams?.banner || null}
    />
  );
}

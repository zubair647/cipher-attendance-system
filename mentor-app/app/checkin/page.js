import { getSession } from '../../lib/session';
import CameraCapture from '../../components/CameraCapture';

export const dynamic = 'force-dynamic';

export default function CheckInPage() {
  const session = getSession();
  return <CameraCapture mode="checkin" universityCode={session?.university} />;
}

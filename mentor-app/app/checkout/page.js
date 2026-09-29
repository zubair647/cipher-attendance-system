import { getSession } from '../../lib/session';
import CameraCapture from '../../components/CameraCapture';

export const dynamic = 'force-dynamic';

export default function CheckOutPage() {
  const session = getSession();
  return <CameraCapture mode="checkout" universityCode={session?.university} />;
}

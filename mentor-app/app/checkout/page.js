import { getSessionMentorId } from '../../lib/session';
import { getMentorHomeData } from '../../lib/mentorData';
import CameraCapture from '../../components/CameraCapture';

export default function CheckOutPage() {
  const mentorId = getSessionMentorId();
  const data = getMentorHomeData(mentorId);
  return <CameraCapture mode="checkout" universityCode={data?.university?.code} />;
}

import { getSessionMentorId } from '../../lib/session';
import { getMentorHomeData } from '../../lib/mentorData';
import CameraCapture from '../../components/CameraCapture';

export default function CheckInPage() {
  const mentorId = getSessionMentorId();
  const data = getMentorHomeData(mentorId);
  return <CameraCapture mode="checkin" universityCode={data?.university?.code} />;
}

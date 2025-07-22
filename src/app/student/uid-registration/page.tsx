import ComingSoonPage from '@/components/ComingSoonPage';

export default function StudentUidRegistrationPage() {
  return (
    <ComingSoonPage
      title="UID 등록"
      description="NFC 카드 UID를 등록하여 출석 체크를 할 수 있는 기능입니다."
      backHref="/student/home"
      backText="학생 홈으로"
    />
  );
} 
import ComingSoonPage from '@/components/ComingSoonPage';

export default function StudentExamPrepPage() {
  return (
    <ComingSoonPage
      title="시험준비"
      description="TOPIK 등 한국어 시험 준비를 위한 학습 기능입니다."
      backHref="/student/home"
      backText="학생 홈으로"
    />
  );
} 
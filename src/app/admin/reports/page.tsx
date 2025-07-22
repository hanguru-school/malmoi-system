'use client';

import ComingSoonPage from '@/components/ComingSoonPage';

export default function AdminReportsPage() {
  return (
    <ComingSoonPage
      title="통계/리포트"
      description="학원 운영 통계, 학생 성과 리포트, 매출 분석 등을 확인할 수 있는 기능입니다."
      backHref="/admin"
      backText="관리자 홈으로"
    />
  );
} 
'use client';

import ComingSoonPage from '@/components/ComingSoonPage';

export default function AdminPaymentsPage() {
  return (
    <ComingSoonPage
      title="결제 관리"
      description="학생들의 결제 내역, 환불 처리, 결제 수단 관리 등을 할 수 있는 기능입니다."
      backHref="/admin"
      backText="관리자 홈으로"
    />
  );
} 
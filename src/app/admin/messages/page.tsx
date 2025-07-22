'use client';

import ComingSoonPage from '@/components/ComingSoonPage';

export default function AdminMessagesPage() {
  return (
    <ComingSoonPage
      title="메시지 관리"
      description="학생 및 선생님에게 발송하는 알림 메시지를 관리할 수 있는 기능입니다."
      backHref="/admin"
      backText="관리자 홈으로"
    />
  );
} 
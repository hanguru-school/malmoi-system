'use client';

import ComingSoonPage from '@/components/ComingSoonPage';

export default function AdminSettingsPage() {
  return (
    <ComingSoonPage
      title="시스템 설정"
      description="학원 운영에 필요한 다양한 시스템 설정을 관리할 수 있는 기능입니다."
      backHref="/admin"
      backText="관리자 홈으로"
    />
  );
} 
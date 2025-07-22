'use client';

import ComingSoonPage from '@/components/ComingSoonPage';

export default function AdminLessonsPage() {
  return (
    <ComingSoonPage
      title="수업 관리"
      description="수업 일정, 강의 자료, 학생 관리 등을 통합적으로 관리할 수 있는 기능입니다."
      backHref="/admin"
      backText="관리자 홈으로"
    />
  );
} 
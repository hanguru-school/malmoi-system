'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserDashboard } from '@/lib/auth-utils';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 클라이언트 사이드에서 세션 확인
    const checkSession = () => {
      const userSession = localStorage.getItem('user-session');
      
      // 디버깅: 세션 정보 출력
      console.log('Current user session:', userSession);
      
      if (userSession) {
        try {
          const userData = JSON.parse(userSession);
          console.log('Parsed user data:', userData);
          
          // 역할에 따른 적절한 대시보드로 리다이렉트
          const dashboardPath = getCurrentUserDashboard();
          console.log('Redirecting to dashboard:', dashboardPath);
          router.push(dashboardPath);
        } catch (error) {
          console.error('Session parsing error:', error);
          // 세션 파싱 오류 시 로그인 페이지로 리다이렉트
          router.push('/auth/login');
        }
      } else {
        console.log('No user session found, redirecting to login');
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        router.push('/auth/login');
      }
    };

    checkSession();
  }, [router]);

  // 로딩 중 표시
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 로딩 중입니다...</p>
        <button 
          onClick={() => {
            localStorage.removeItem('user-session');
            document.cookie = 'user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            router.push('/auth/login');
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          세션 초기화
        </button>
      </div>
    </div>
  );
}

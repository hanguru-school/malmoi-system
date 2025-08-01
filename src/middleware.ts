import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 역할 타입 정의
type UserRole = 'master' | 'admin' | 'teacher' | 'staff' | 'student';

// 역할별 접근 가능한 경로 정의
const ROLE_ACCESS_PATHS: Record<UserRole, string[]> = {
  master: ['/admin', '/teacher', '/staff', '/student'],
  admin: ['/admin'],
  teacher: ['/teacher'],
  staff: ['/staff'],
  student: ['/student']
};

// 역할별 기본 대시보드 경로
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  master: '/admin',
  admin: '/admin',
  teacher: '/teacher',
  staff: '/staff',
  student: '/student'
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 로그인 페이지는 제외
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // 정적 파일들은 제외
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 쿠키에서 사용자 세션 확인
  const userSession = request.cookies.get('user-session');
  
  // 로그인되지 않은 경우
  if (!userSession) {
    // 루트 경로로 접근하면 로그인 페이지로 리다이렉트
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // 보호된 경로 접근 시 로그인 페이지로 리다이렉트
    const protectedPaths = ['/admin', '/teacher', '/staff', '/student', '/employee'];
    if (protectedPaths.some((path: string) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    return NextResponse.next();
  }

  // 로그인된 경우
  try {
    const userData = JSON.parse(userSession.value);
    const userRole = (userData.accountType || userData.role) as UserRole;
    
    // 루트 경로로 접근하면 역할에 따라 적절한 대시보드로 리다이렉트
    if (pathname === '/') {
      const dashboardPath = ROLE_DASHBOARDS[userRole] || '/auth/login';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    
    // 역할별 접근 권한 확인
    const hasAccess = checkRoleAccess(userRole, pathname);
    
    if (!hasAccess) {
      // 권한이 없는 경우 해당 역할의 대시보드로 리다이렉트
      const dashboardPath = ROLE_DASHBOARDS[userRole] || '/auth/login';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    
  } catch (error) {
    // 세션 파싱 오류 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

// 역할별 접근 권한 확인 함수
function checkRoleAccess(userRole: UserRole, pathname: string): boolean {
  // 마스터는 모든 경로에 접근 가능
  if (userRole === 'master') {
    return true;
  }
  
  // 각 역할별 접근 가능한 경로 확인
  const allowedPaths = ROLE_ACCESS_PATHS[userRole] || [];
  
  // 해당 역할이 접근할 수 있는 경로인지 확인
  return allowedPaths.some((path: string) => pathname.startsWith(path));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 
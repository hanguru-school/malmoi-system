import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, hasRole } from '@/lib/auth-utils';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // 1. 도메인 체크 - app.hanguru.school은 정상 처리
  if (hostname === 'hanguru.school' || hostname === 'www.hanguru.school') {
    return new NextResponse('Domain not configured on this platform', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  // 2. 공개 경로 정의
  const publicPaths = [
    '/', // 메인 페이지를 공개 경로로 추가
    '/auth/login', '/auth/register', '/auth/cognito-login', '/auth/success',
    '/tagging', '/rc-s380-test',
    '/reservation/japanese', '/reservation/japanese/login', '/reservation/japanese/register',
    '/api/auth/login', '/api/auth/register', '/api/auth/session', '/api/auth/verify',
    '/api/auth/cognito-login', '/api/auth/callback/cognito',
    '/api/reservation/japanese/login', '/api/reservation/japanese/register',
    '/api/system/env-status', '/api/system/status',
    '/api/health', '/api/healthcheck',
    '/_next', '/favicon.ico', '/public'
  ];

  // 3. 공개 경로인지 확인
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 4. 공개 경로는 바로 통과
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 5. 인증이 필요한 경로인지 확인
  const requiresAuth = !pathname.startsWith('/_next') && !pathname.startsWith('/favicon.ico');

  // 6. 인증 확인
  if (requiresAuth) {
    const isAuth = isAuthenticated(request);
    
    if (!isAuth) {
      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 사용자 역할 확인
    const userRole = getSessionFromCookies(request)?.user?.role;

    // 7. 역할별 메인 페이지 리다이렉트
    if (pathname === '/') {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (userRole === 'STUDENT') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url));
      } else if (userRole === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
      } else if (userRole === 'STAFF') {
        return NextResponse.redirect(new URL('/staff/home', request.url));
      }
    }

    // 8. 관리자는 모든 페이지에 접근 가능
    if (userRole === 'ADMIN') {
      return NextResponse.next();
    }

    // 9. 역할 기반 접근 제어 (관리자 제외)
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    if (pathname.startsWith('/teacher') && userRole !== 'TEACHER') {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    if (pathname.startsWith('/staff') && userRole !== 'STAFF') {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    if (pathname.startsWith('/student') && userRole !== 'STUDENT') {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
  }

  // 10. 보안 헤더 추가
  const response = NextResponse.next();
  
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// 세션에서 사용자 정보를 가져오는 헬퍼 함수
function getSessionFromCookies(request: NextRequest) {
  try {
    const session = request.cookies.get('auth-session');
    if (!session) return null;
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
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

  // 4. 인증이 필요한 경로인지 확인
  const requiresAuth = !isPublicPath && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon.ico');

  // 5. 인증 확인
  if (requiresAuth) {
    const isAuth = isAuthenticated(request);
    
    if (!isAuth) {
      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 역할 기반 접근 제어
    if (pathname.startsWith('/admin') && !hasRole(request, 'ADMIN')) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    if (pathname.startsWith('/teacher') && !hasRole(request, 'TEACHER')) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    if (pathname.startsWith('/staff') && !hasRole(request, 'STAFF')) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }

    if (pathname.startsWith('/student') && !hasRole(request, 'STUDENT')) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
  }

  // 6. 보안 헤더 추가
  const response = NextResponse.next();
  
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
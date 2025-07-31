import { NextRequest, NextResponse } from 'next/server';

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

  // 5. 보안 헤더 추가
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
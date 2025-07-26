import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. 브라우저 User-Agent 체크 (비정상 접근 차단)
  const userAgent = request.headers.get('user-agent') || '';
  const isBrowser = /Mozilla|Chrome|Safari|Edge|Opera|Firefox/i.test(userAgent);
  
  // 개발 모드에서는 User-Agent 체크 우회
  if (process.env.NODE_ENV !== 'development' && !isBrowser) {
    return new NextResponse('Forbidden: Browser access only', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }

  // 2. 공개 접근 가능한 경로들 (인증 불필요)
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/tagging',
    '/rc-s380-test',
    '/reservation/japanese',
    '/reservation/japanese/login',
    '/reservation/japanese/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/simple-login',
    '/api/auth/verify',
    '/api/reservation/japanese/login',
    '/api/reservation/japanese/register',
    '/_next',
    '/favicon.ico',
    '/public'
  ];

  // 3. 일본인 예약 시스템의 공개 경로들
  const japanesePublicPaths = [
    '/reservation/japanese',
    '/reservation/japanese/login',
    '/reservation/japanese/register'
  ];

  // 4. 인증이 필요한 경로들
  const protectedPaths = [
    '/master',
    '/admin',
    '/reservation/japanese/new',
    '/reservation/japanese/mypage',
    '/reservation/japanese/confirm'
  ];

  // 5. API 경로에서 인증이 필요한 것들
  const protectedApiPaths = [
    '/api/users/profile',
    '/api/menus/user',
    '/api/settings',
    '/api/reservation/japanese/create',
    '/api/reservation/japanese/details',
    '/api/reservation/japanese/cancel',
    '/api/reservation/japanese/list'
  ];

  // 6. 공개 경로인지 확인
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) ||
                      japanesePublicPaths.some(path => pathname === path);

  // 7. 보호된 경로인지 확인
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path)) ||
                         protectedApiPaths.some(path => pathname.startsWith(path));

  // 8. 루트 경로 (/) 처리 - 메인 페이지 표시 허용
  if (pathname === '/') {
    // 루트 경로는 메인 페이지로 허용
    return NextResponse.next();
  }

  // 9. 보호된 경로에 대한 인증 확인 (임시 비활성화)
  if (isProtectedPath) {
    // 인증 체크를 임시로 비활성화하여 테스트
    // TODO: 나중에 인증 체크를 다시 활성화
    console.log('Protected path accessed:', pathname, '- Auth check disabled for testing');
  }

  // 10. API 경로에 대한 추가 보안 (임시 비활성화)
  if (pathname.startsWith('/api/') && !isPublicPath) {
    // API 보안 검증을 임시로 비활성화하여 테스트
    // TODO: 나중에 보안 검증을 다시 활성화
    console.log('API path accessed:', pathname, '- Security check disabled for testing');
  }

  // 11. 보안 헤더 추가
  const response = NextResponse.next();
  
  // XSS 방지
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // 클릭재킹 방지
  response.headers.set('X-Frame-Options', 'DENY');
  
  // MIME 타입 스니핑 방지
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (기본)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  return response;
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
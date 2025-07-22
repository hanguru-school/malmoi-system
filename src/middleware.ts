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

  // 8. 루트 경로 (/) 처리
  if (pathname === '/') {
    // 루트 접속 시 마스터 페이지로 리다이렉트 (로그인/태깅 필요)
    return NextResponse.redirect(new URL('/master', request.url));
  }

  // 9. 보호된 경로에 대한 인증 확인
  if (isProtectedPath) {
    // 개발 모드에서는 인증 체크 우회
    if (process.env.NODE_ENV === 'development') {
      // 개발 모드에서는 인증 체크를 건너뜀
    } else {
      const authToken = request.cookies.get('auth_token');
      const japaneseToken = request.cookies.get('japanese_student_token');
      
      // 인증 토큰이 없으면 로그인 페이지로 리다이렉트
      if (!authToken && !japaneseToken) {
        // 일본인 예약 시스템의 경우
        if (pathname.startsWith('/reservation/japanese/')) {
          return NextResponse.redirect(new URL('/reservation/japanese/login', request.url));
        }
        // 일반 시스템의 경우
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }

  // 10. API 경로에 대한 추가 보안
  if (pathname.startsWith('/api/')) {
    // API 요청에 대한 추가 검증
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    
    // hanguru.school 도메인에서만 API 호출 허용 (개발 환경에서는 제외)
    if (process.env.NODE_ENV === 'production') {
      if (referer && !referer.includes('hanguru.school')) {
        return new NextResponse('Forbidden: Invalid referer', { status: 403 });
      }
      
      if (origin && !origin.includes('hanguru.school')) {
        return new NextResponse('Forbidden: Invalid origin', { status: 403 });
      }
    }
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
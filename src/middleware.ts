import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // hanguru.school은 워드프레스 호스팅에서 처리
  if (hostname === 'hanguru.school' || hostname === 'www.hanguru.school') {
    return new NextResponse('Domain not configured on this platform', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  // 2. 브라우저 User-Agent 체크 (개발 모드에서는 우회)
  if (process.env.NODE_ENV !== 'development') {
    const userAgent = request.headers.get('user-agent') || '';
    const isBrowser = /Mozilla|Chrome|Safari|Edge|Opera|Firefox/i.test(userAgent);
    
    if (!isBrowser) {
      return new NextResponse('Forbidden: Browser access only', { 
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  // 3. 공개 경로 정의
  const publicPaths = [
    '/auth/login', '/auth/register', '/auth/cognito-login', '/tagging', '/rc-s380-test',
    '/reservation/japanese', '/reservation/japanese/login', '/reservation/japanese/register',
    '/api/auth/login', '/api/auth/register', '/api/auth/session', '/api/auth/verify',
    '/api/auth/cognito-login', '/api/auth/callback/cognito',
    '/api/reservation/japanese/login', '/api/reservation/japanese/register',
    '/_next', '/favicon.ico', '/public'
  ];

  // 4. 공개 경로인지 확인
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 5. 보안 헤더 추가
  const response = NextResponse.next();
  
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
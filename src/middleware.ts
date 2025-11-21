import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 입회 동의서 인쇄 전용 페이지는 토큰으로만 보호
  if (pathname.startsWith("/enrollment-agreement/print/")) {
    const token = request.nextUrl.searchParams.get("token");
    const expected = process.env.PRINT_TOKEN;

    if (!expected || !token || token !== expected) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.next();
  }

  // API 경로는 미들웨어에서 제외 (API 자체에서 인증 처리)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 정적 파일들은 제외
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // 공개 페이지들은 인증 없이 접근 가능
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/line-register',
    '/enrollment',
    '/rules',
    '/enrollment-agreement',
    '/terms'
  ];

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // 관리자 페이지 접근 시 인증 확인
  if (pathname.startsWith('/admin/')) {
    // 쿠키에서 인증 정보 확인
    const sessionCookie = request.cookies.get('session');
    const userCookie = request.cookies.get('user');
    
    if (!sessionCookie || !userCookie) {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      const user = JSON.parse(userCookie.value);
      
      // 관리자 권한 확인
      if (user.role !== 'ADMIN' && user.role !== 'MASTER') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } catch (error) {
      // 쿠키 파싱 오류 시 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // 다른 보호된 페이지들도 동일한 방식으로 처리
  const protectedPaths = ['/student/', '/teacher/', '/staff/', '/employee/', '/parent/'];
  
  for (const path of protectedPaths) {
    if (pathname.startsWith(path)) {
      const sessionCookie = request.cookies.get('session');
      const userCookie = request.cookies.get('user');
      
      if (!sessionCookie || !userCookie) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      try {
        const user = JSON.parse(userCookie.value);
        
        // 해당 역할 확인
        const requiredRole = path.replace('/', '').toUpperCase();
        if (user.role !== requiredRole) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

// 권한에 따른 대시보드 경로 결정
function getDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN":
    case "MASTER":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "STAFF":
      return "/staff";
    case "EMPLOYEE":
      return "/employee";
    case "PARENT":
      return "/parent";
    case "STUDENT":
    default:
      return "/student";
  }
}

// 권한에 따른 페이지 접근 확인
function checkAccess(role: string, pathname: string): boolean {
  // 관리자 권한
  if (role === "ADMIN" || role === "MASTER") {
    return pathname.startsWith("/admin/") || pathname === "/admin";
  }

  // 선생님 권한
  if (role === "TEACHER") {
    return pathname.startsWith("/teacher/") || pathname === "/teacher";
  }

  // 사무직원 권한
  if (role === "STAFF") {
    return pathname.startsWith("/staff/") || pathname === "/staff";
  }

  // 직원 권한
  if (role === "EMPLOYEE") {
    return pathname.startsWith("/employee/") || pathname === "/employee";
  }

  // 학부모 권한
  if (role === "PARENT") {
    return pathname.startsWith("/parent/") || pathname === "/parent";
  }

  // 학생 권한 (기본)
  if (role === "STUDENT") {
    return pathname.startsWith("/student/") || pathname === "/student";
  }

  return false;
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 운영 서버 환경 체크
  const hostname = request.headers.get("host") || "";
  const isProduction =
    hostname === "app.hanguru.school" || hostname === "hanguru.school";

  // 비운영 환경에서 API 요청이 아닌 경우 경고 페이지로 리다이렉트
  if (
    !isProduction &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/")
  ) {
    // 정적 파일들은 제외
    if (pathname.includes(".") || pathname.startsWith("/_next/")) {
      return NextResponse.next();
    }

    // 경고 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/environment-warning", request.url));
  }

  // 로그인 페이지는 제외
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // 정적 파일들은 제외
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 쿠키에서 사용자 세션 확인
  const userSession = request.cookies.get("user-session");

  // 로그인되지 않은 경우
  if (!userSession) {
    // 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
    if (
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/employee/") ||
      pathname.startsWith("/teacher/") ||
      pathname.startsWith("/staff/")
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
  }

  // 로그인된 경우
  try {
    const userData = JSON.parse(userSession.value);

    // 권한에 따른 페이지 접근 제어
    const hasAccess = checkAccess(userData.role, pathname);
    if (!hasAccess) {
      const dashboardPath = getDashboardPath(userData.role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  } catch (error) {
    // 세션 파싱 오류 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/auth/login", request.url));
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

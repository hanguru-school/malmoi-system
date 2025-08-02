import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 미들웨어 완전 비활성화 (메인 페이지 표시를 위해)
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

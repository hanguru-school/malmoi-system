import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 },
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        teacher: true,
        staff: true,
        admin: true,
        parent: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "존재하지 않는 사용자입니다." },
        { status: 401 },
      );
    }

    // 비밀번호 검증 (실제 환경에서는 해시된 비밀번호 비교)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    // 사용자 역할에 따른 대시보드 경로 결정
    let dashboardPath = "/student";
    let userRole = user.role;

    // 이메일 기반 추가 역할 판단
    const emailDomain = email.toLowerCase();
    if (emailDomain.includes("admin") || emailDomain.includes("master")) {
      userRole = "ADMIN";
      dashboardPath = "/admin";
    } else if (
      emailDomain.includes("teacher") ||
      emailDomain.includes("선생님")
    ) {
      userRole = "TEACHER";
      dashboardPath = "/teacher";
    } else if (
      emailDomain.includes("employee") ||
      emailDomain.includes("staff") ||
      emailDomain.includes("직원")
    ) {
      userRole = "STAFF";
      dashboardPath = "/staff";
    } else if (
      emailDomain.includes("parent") ||
      emailDomain.includes("학부모")
    ) {
      userRole = "PARENT";
      dashboardPath = "/parent";
    }

    // 세션 데이터 생성
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      dashboardPath,
      loginTime: new Date().toISOString(),
    };

    // 쿠키에 세션 저장 (7일간 유효)
    const cookieStore = await cookies();
    cookieStore.set("user-session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7일
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
      },
      dashboardPath,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "로그인 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// 사용자 역할에 따른 리다이렉트 URL 반환 함수
function getRedirectUrlByRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "STUDENT":
      return "/student";
    case "PARENT":
      return "/parent";
    case "EMPLOYEE":
      return "/employee";
    case "STAFF":
      return "/staff";
    default:
      return "/admin";
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("로그인 API 시작");
    
    // 환경 변수 확인
    console.log("환경 변수 확인:");
    console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "설정됨" : "설정되지 않음");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- VERCEL_ENV:", process.env.VERCEL_ENV);
    
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL이 설정되지 않음");
      return NextResponse.json(
        { 
          success: false, 
          message: "데이터베이스 연결 설정이 누락되었습니다.",
          error: "DATABASE_URL_NOT_SET"
        },
        { status: 500 }
      );
    }
    
    // 기본 요청 데이터 확인
    const body = await request.json();
    console.log("받은 데이터:", { email: body.email, hasPassword: !!body.password });
    
    if (!body.email || !body.password) {
      return NextResponse.json(
        { 
          success: false, 
          message: "이메일과 비밀번호를 입력해주세요.",
          error: "MISSING_CREDENTIALS"
        },
        { status: 400 }
      );
    }

    console.log("사용자 조회 시작:", body.email.toLowerCase());
    
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        student: true,
        teacher: true,
        admin: true,
        staff: true,
      },
    });

    console.log("사용자 조회 결과:", user ? "사용자 발견" : "사용자 없음");

    if (!user) {
      console.log("사용자를 찾을 수 없음");
      return NextResponse.json(
        { 
          success: false, 
          message: "이메일 또는 비밀번호가 일치하지 않습니다.",
          error: "USER_NOT_FOUND"
        },
        { status: 401 }
      );
    }

    // 비밀번호 검증 (bcrypt로 해시된 비밀번호 비교)
    console.log("비밀번호 검증 시작");
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    console.log("비밀번호 검증 결과:", isPasswordValid ? "성공" : "실패");
    
    if (!isPasswordValid) {
      console.log("비밀번호 불일치");
      return NextResponse.json(
        { 
          success: false, 
          message: "이메일 또는 비밀번호가 일치하지 않습니다.",
          error: "INVALID_PASSWORD"
        },
        { status: 401 }
      );
    }

    console.log("로그인 성공, 세션 설정 시작");

    // 로그인 성공 - 세션 설정
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });
    
    // 사용자 정보 쿠키 설정 (비밀번호 제외)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    cookieStore.set("user", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    console.log("로그인 성공:", {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionToken: sessionToken.substring(0, 20) + "..."
    });

    return NextResponse.json({
      success: true,
      message: "로그인 성공",
      user: userData,
      redirectUrl: getRedirectUrlByRole(user.role)
    });
    
  } catch (error) {
    // 개발환경에서만 에러 로그 출력
    if (process.env.NODE_ENV !== "production") {
      console.error("로그인 API 오류:", error);
    }
    
    // 구체적인 에러 메시지 반환
    let errorMessage = "로그인 중 오류가 발생했습니다.";
    let errorCode = "UNKNOWN_ERROR";
    
    if (error instanceof Error) {
      if (error.message.includes("connect")) {
        errorMessage = "데이터베이스 연결 오류가 발생했습니다.";
        errorCode = "DATABASE_CONNECTION_ERROR";
      } else if (error.message.includes("timeout")) {
        errorMessage = "데이터베이스 연결 시간 초과가 발생했습니다.";
        errorCode = "DATABASE_TIMEOUT_ERROR";
      } else if (error.message.includes("authentication")) {
        errorMessage = "데이터베이스 인증 오류가 발생했습니다.";
        errorCode = "DATABASE_AUTH_ERROR";
      } else {
        errorCode = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorCode
      },
      { status: 500 }
    );
  }
}

// GET 요청도 처리 (테스트용)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "로그인 API 정상 작동",
    timestamp: new Date().toISOString()
  });
}

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

    console.log("사용자 조회 시작:", body.email);
    
    // 이메일 또는 학번으로 사용자 조회
    let user = null;
    
    // 이메일로 조회
    if (body.email.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
        include: {
          student: true,
          teacher: true,
          admin: true,
          staff: true,
        },
      });
    } else {
      // 학번으로 조회 (Student 테이블에서 studentId로 조회 후 User 가져오기)
      const student = await prisma.student.findUnique({
        where: { studentId: body.email },
        include: {
          user: {
            include: {
              student: true,
              teacher: true,
              admin: true,
              staff: true,
            },
          },
        },
      });
      
      if (student) {
        user = student.user;
      }
    }

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
    
    // 사용자 정보 쿠키 설정 (비밀번호 제외)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // 첫 로그인 체크 및 리다이렉트 URL 결정
    let redirectUrl = getRedirectUrlByRole(user.role);
    
    // 학생의 경우 첫 로그인 체크
    if (user.role === "STUDENT" && user.student?.isFirstLogin) {
      // 첫 로그인인 경우 패스워드 변경 페이지로
      redirectUrl = "/student/change-password";
    }
    
    // 마스터 관리자의 경우 첫 로그인 체크
    if (user.role === "ADMIN" && user.admin?.permissions?.isMaster) {
      // 마스터 관리자 설정 페이지로
      redirectUrl = "/admin/master-setup";
    }

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: "로그인 성공",
      user: userData,
      isFirstLogin: user.isFirstLogin,
      redirectUrl: redirectUrl
    });
    
    // HTTP 환경에서도 작동하도록 secure 플래그 조정
    const isSecure = process.env.NODE_ENV === "production" && request.url.startsWith("https://");
    
    // 응답 객체에 쿠키 설정 (이 방법이 Next.js에서 올바른 방법)
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });
    
    response.cookies.set("user", JSON.stringify(userData), {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    console.log("로그인 성공:", {
      userId: user.id,
      email: user.email,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      sessionToken: sessionToken.substring(0, 20) + "...",
      redirectUrl: redirectUrl
    });
    
    return response;
    
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

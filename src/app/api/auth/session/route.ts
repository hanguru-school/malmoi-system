import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("=== 세션 확인 API 시작 ===");

    // 세션 쿠키에서 사용자 정보 추출
    const session = request.cookies.get("auth-session");
    console.log("세션 쿠키 존재:", !!session);

    if (!session) {
      console.log("세션 쿠키 없음");
      return NextResponse.json({ user: null });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
      console.log("세션 데이터 파싱 성공:", {
        userId: sessionData?.user?.id,
        userRole: sessionData?.user?.role,
        userEmail: sessionData?.user?.email,
      });
    } catch (parseError) {
      console.error("세션 파싱 실패:", parseError);
      return NextResponse.json({ user: null });
    }

    if (!sessionData?.user?.id) {
      console.log("유효하지 않은 세션 데이터");
      return NextResponse.json({ user: null });
    }

    // 세션 만료 확인
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      console.log("세션 만료됨");
      return NextResponse.json({ user: null });
    }

    // DB에서 최신 사용자 정보 가져오기
    console.log("사용자 정보 조회 중:", sessionData.user.id);
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      include: {
        student: true,
        teacher: true,
        staff: true,
        admin: true,
      },
    });

    if (!dbUser) {
      console.log("사용자 정보 없음");
      return NextResponse.json({ user: null });
    }

    console.log("사용자 정보 조회 성공:", {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
    });

    // 비밀번호 제거
    const { password: _, ...userWithoutPassword } = dbUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("=== 세션 확인 API 오류 ===");
    console.error(
      "오류 타입:",
      error instanceof Error ? error.constructor.name : typeof error,
    );
    console.error(
      "오류 메시지:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "오류 스택:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    return NextResponse.json({ user: null });
  }
}

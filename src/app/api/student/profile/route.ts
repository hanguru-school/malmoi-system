import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    console.log("=== 학생 프로필 조회 API 시작 ===");

    // 1. 세션 확인
    const session = await getSessionFromCookies(request);
    if (!session?.user?.id) {
      console.log("세션 없음 - 401 반환");
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    // 2. 학생 정보 조회
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reservations: {
          where: {
            status: "CONFIRMED",
          },
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            duration: true,
          },
        },
      },
    });

    if (!student) {
      console.log("학생 정보 없음 - 404 반환");
      return NextResponse.json(
        { error: "학생 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 3. 학습 통계 계산
    const totalAttendance = student.reservations.length;
    const totalStudyTime = student.reservations.reduce((total, reservation) => {
      const start = new Date(`2024-01-15 ${reservation.startTime}`);
      const end = new Date(`2024-01-15 ${reservation.endTime}`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60); // 분 단위
      return total + duration;
    }, 0);

    // 4. UID 생성 (실제로는 더 복잡한 로직 필요)
    const uid = `STU${student.id.slice(-8).toUpperCase()}`;

    // 5. LINE 연동 상태 (실제로는 LINE API 연동 필요)
    const lineConnected = false; // 임시로 false

    // 6. 예약 가능 시간 계산 (실제로는 더 복잡한 로직 필요)
    const remainingTime = 160; // 임시로 160분

    console.log("학생 프로필 조회 성공:", student.id);

    // 7. 응답 반환
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.user.email,
        phone: student.phone || "",
        address: "", // 실제로는 주소 필드 필요
        level: student.level,
        points: student.points,
        joinDate: student.joinDate,
        uid: uid,
        lineConnected: lineConnected,
        totalAttendance: totalAttendance,
        totalStudyTime: Math.round(totalStudyTime),
        remainingTime: remainingTime,
        lastModified: student.updatedAt,
      },
    });
  } catch (error) {
    console.error("=== 학생 프로필 조회 API 오류 ===");
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

    return NextResponse.json(
      { error: "학생 프로필 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("=== 학생 프로필 수정 API 시작 ===");

    // 1. 세션 확인
    const session = await getSessionFromCookies(request);
    if (!session?.user?.id) {
      console.log("세션 없음 - 401 반환");
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    console.log("요청 데이터:", body);

    const { name, email, phone, address } = body;

    // 3. 입력 검증
    if (!name || !email) {
      console.log("필수 필드 누락");
      return NextResponse.json(
        { error: "이름과 이메일은 필수입니다." },
        { status: 400 },
      );
    }

    // 4. 학생 정보 업데이트
    const updatedStudent = await prisma.student.update({
      where: { userId: session.user.id },
      data: {
        name: name,
        phone: phone || "",
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // 5. 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name,
        email: email,
        phone: phone || "",
        updatedAt: new Date(),
      },
    });

    console.log("학생 프로필 수정 성공:", updatedStudent.id);

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      message: "프로필이 성공적으로 수정되었습니다.",
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedUser.email,
        phone: updatedStudent.phone || "",
        address: "", // 실제로는 주소 필드 필요
        level: updatedStudent.level,
        points: updatedStudent.points,
        joinDate: updatedStudent.joinDate,
        lastModified: updatedStudent.updatedAt,
      },
    });
  } catch (error) {
    console.error("=== 학생 프로필 수정 API 오류 ===");
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

    return NextResponse.json(
      { error: "프로필 수정 중 오류가 발생했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromCookies(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 학생 정보 조회
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        reservations: {
          where: {
            status: "completed",
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            duration: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "학생 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 통계 계산
    const totalAttendance = student.reservations.length;
    const totalStudyTime = student.reservations.reduce((total, reservation) => {
      return total + (reservation.duration || 0);
    }, 0);

    // 평균 점수 계산 (예시)
    const averageScore = 85; // 실제로는 데이터베이스에서 계산

    const profileData = {
      studentId: student.id,
      name: student.name,
      email: student.user.email,
      level: student.level,
      points: student.points,
      totalAttendance,
      totalStudyTime,
      averageScore,
      joinDate: student.joinDate,
      avatar: student.avatar,
    };

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("학생 프로필 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromCookies(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, level, avatar } = body;

    // 학생 정보 업데이트
    const updatedStudent = await prisma.student.update({
      where: { userId: session.user.id },
      data: {
        name: name || undefined,
        level: level || undefined,
        avatar: avatar || undefined,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        studentId: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.user.email,
        level: updatedStudent.level,
        points: updatedStudent.points,
        avatar: updatedStudent.avatar,
      },
    });
  } catch (error) {
    console.error("학생 프로필 업데이트 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

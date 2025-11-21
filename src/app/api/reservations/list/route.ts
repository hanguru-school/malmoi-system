import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (선택적)
    const session = getSessionFromCookies(request);
    let userRole = null;
    let userId = null;

    if (session) {
      userId = session.user.id;
      userRole = session.user.role;
    }

    // 날짜 범위 필터 (선택적) - 최근 3개월로 제한하여 성능 개선
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    const whereClause: any = {};
    
    // 날짜 범위가 지정되지 않은 경우, 최근 3개월로 제한
    if (!startDate || !endDate) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      whereClause.date = {
        gte: threeMonthsAgo,
      };
    } else {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // 사용자 역할에 따른 예약 조회
    let reservations;

    if (!session || userRole === "ADMIN") {
      // 관리자이거나 세션이 없는 경우 모든 예약 조회 (관리자 대시보드용)
      reservations = await prisma.reservation.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 1000, // 최대 1000개로 제한
      });
    } else if (userRole === "STUDENT") {
      // 학생은 자신의 예약만 조회
      const student = await prisma.student.findUnique({
        where: { userId: userId },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 },
        );
      }

      reservations = await prisma.reservation.findMany({
        where: {
          studentId: student.id,
          ...whereClause,
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 1000,
      });
    } else if (userRole === "TEACHER") {
      // 선생님은 자신의 예약만 조회
      const teacher = await prisma.teacher.findUnique({
        where: { userId: userId },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher not found" },
          { status: 404 },
        );
      }

      reservations = await prisma.reservation.findMany({
        where: {
          teacherId: teacher.id,
          ...whereClause,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 1000,
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        date: reservation.date.toISOString().split('T')[0],
        startTime: reservation.startTime.toISOString().split('T')[1].substring(0, 5),
        endTime: reservation.endTime.toISOString().split('T')[1].substring(0, 5),
        studentName: reservation.student?.user?.name || reservation.student?.name || "알 수 없음",
        serviceName: reservation.lessonType || "수업",
        teacherName: reservation.teacher?.user?.name || reservation.teacher?.name || "미배정",
        status: reservation.status.toLowerCase(),
        isCompleted: reservation.status === "COMPLETED",
        isTagged: false, // 태깅 정보는 별도 구현 필요
        duration: reservation.duration,
        location: reservation.location,
        notes: reservation.notes,
        createdAt: reservation.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("예약 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 },
    );
  }
}

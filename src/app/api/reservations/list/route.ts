import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = getSessionFromCookies(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // 사용자 역할에 따른 예약 조회
    let reservations;

    if (userRole === "ADMIN") {
      // 관리자는 모든 예약 조회
      reservations = await prisma.reservation.findMany({
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
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        location: reservation.location,
        notes: reservation.notes,
        studentName:
          reservation.student?.user?.name || reservation.student?.name,
        teacherName:
          reservation.teacher?.user?.name || reservation.teacher?.name,
        createdAt: reservation.createdAt,
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

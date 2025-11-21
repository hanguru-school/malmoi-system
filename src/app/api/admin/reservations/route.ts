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

    // 예약 목록 조회
    const reservations = await prisma.reservation.findMany({
      include: {
        student: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log("실제 예약 데이터:", reservations);

    // 응답 데이터 형식 변환
    const formattedReservations = reservations.map((reservation: any) => ({
      id: reservation.id,
      studentName: reservation.student?.name || "알 수 없음",
      studentId: reservation.student?.id || "알 수 없음",
      courseName: reservation.lessonType || "미정",
      teacherName: "미배정",
      date: reservation.date ? new Date(reservation.date).toISOString().split('T')[0] : "",
      time: reservation.startTime ? new Date(reservation.startTime).toTimeString().split(' ')[0].substring(0, 5) : "",
      duration: reservation.duration || 60,
      status: reservation.status || "PENDING",
      price: reservation.price || 0,
      paymentStatus: "UNPAID",
      notes: reservation.notes || "",
      createdAt: reservation.createdAt ? new Date(reservation.createdAt).toISOString().split('T')[0] : "",
    }));

    return NextResponse.json({
      success: true,
      reservations: formattedReservations,
    });
  } catch (error) {
    console.error("예약 목록 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromCookies(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      courseName,
      teacherName,
      date,
      time,
      duration,
      price,
      notes,
    } = body;

    // 예약 생성
    const reservation = await prisma.reservation.create({
      data: {
        studentId,
        lessonType: courseName,
        date: new Date(date),
        startTime: new Date(`${date}T${time}`),
        endTime: new Date(`${date}T${time}`),
        duration,
        price,
        notes,
        status: "PENDING",
        location: "ONLINE",
      },
      include: {
        student: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    const formattedReservation = {
      id: reservation.id,
      studentName: reservation.student.name,
      studentId: reservation.student.id,
      courseName: reservation.lessonType,
      teacherName: teacherName || "미배정",
      date: reservation.date.toISOString().split('T')[0],
      time: reservation.startTime.toTimeString().split(' ')[0].substring(0, 5),
      duration: reservation.duration,
      status: reservation.status,
      price: reservation.price,
      paymentStatus: "UNPAID",
      notes: reservation.notes,
      createdAt: reservation.createdAt.toISOString().split('T')[0],
    };

    // 관리자 알림 생성
    try {
      await prisma.adminNotification.create({
        data: {
          type: 'NEW_RESERVATION',
          title: '새로운 수업 예약',
          message: `${reservation.student.name}님이 ${courseName} 수업을 예약했습니다.`,
          status: 'UNREAD',
          data: {
            priority: 'medium',
            reservationId: reservation.id,
            studentId: reservation.student.id,
            studentName: reservation.student.name,
            courseName,
            date: reservation.date.toISOString().split('T')[0],
            time: reservation.startTime.toTimeString().split(' ')[0].substring(0, 5),
          },
        },
      });
    } catch (notificationError) {
      console.error('예약 알림 생성 오류:', notificationError);
    }

    return NextResponse.json({
      success: true,
      reservation: formattedReservation,
    });
  } catch (error) {
    console.error("예약 생성 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

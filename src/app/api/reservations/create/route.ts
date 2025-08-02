import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth-utils";
import { ReservationStatus, Location } from "@prisma/client";

// 이메일 알림 함수 (실제 구현에서는 이메일 서비스 사용)
const sendReservationNotification = async (reservationData: any) => {
  try {
    console.log("📧 예약 알림 전송:", {
      to: reservationData.student.email,
      subject: "예약이 완료되었습니다",
      reservationId: reservationData.id,
      date: reservationData.date,
      time: reservationData.startTime,
    });

    // 실제 구현에서는 이메일 서비스 (SendGrid, AWS SES 등) 사용
    // await emailService.send({
    //   to: reservationData.student.email,
    //   subject: '예약이 완료되었습니다',
    //   template: 'reservation-confirmation',
    //   data: reservationData
    // });

    return true;
  } catch (error) {
    console.error("이메일 알림 전송 실패:", error);
    return false;
  }
};

// LINE 알림 함수 (실제 구현에서는 LINE Notify API 사용)
const sendLineNotification = async (reservationData: any) => {
  try {
    console.log("📱 LINE 알림 전송:", {
      reservationId: reservationData.id,
      date: reservationData.date,
      time: reservationData.startTime,
    });

    // 실제 구현에서는 LINE Notify API 사용
    // await lineNotify.send({
    //   message: `예약이 완료되었습니다!\n날짜: ${reservationData.date}\n시간: ${reservationData.startTime}`
    // });

    return true;
  } catch (error) {
    console.error("LINE 알림 전송 실패:", error);
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log("=== 예약 생성 API 시작 ===");

    // 1. 요청 파싱
    const body = await request.json();
    console.log("요청 데이터:", body);

    const {
      date,
      time,
      duration,
      location,
      notes,
      classroom,
      courseId,
      teacherId,
    } = body;

    // 2. 세션 확인
    const session = await getSessionFromCookies(request);
    if (!session?.user?.id) {
      console.log("세션 없음 - 401 반환");
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    // 3. 입력 검증
    if (!date || !time || !duration || !location) {
      console.log("필수 필드 누락:", { date, time, duration, location });
      return NextResponse.json(
        { error: "날짜, 시간, 수업시간, 수업방식은 필수입니다." },
        { status: 400 },
      );
    }

    // 4. 날짜/시간 검증
    const reservationDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (reservationDateTime <= now) {
      console.log("과거 시간 예약 시도 - 400 반환");
      return NextResponse.json(
        { error: "과거 시간에는 예약할 수 없습니다." },
        { status: 400 },
      );
    }

    // 5. 데이터베이스 연결 확인
    try {
      await prisma.$connect();
      console.log("데이터베이스 연결 성공");
    } catch (dbError) {
      console.error("데이터베이스 연결 실패:", dbError);
      return NextResponse.json(
        { error: "데이터베이스 연결에 실패했습니다." },
        { status: 500 },
      );
    }

    // 6. 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
      },
    });

    if (!user) {
      console.log("사용자 정보 없음 - 404 반환");
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (!user.student) {
      console.log("학생 프로필 없음 - 404 반환");
      return NextResponse.json(
        { error: "학생 프로필이 없습니다. 회원가입을 완료해주세요." },
        { status: 404 },
      );
    }

    // 7. 선생님 정보 조회/생성
    let teacher = null;
    if (teacherId) {
      teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
      });
    }

    if (!teacher) {
      // 기본 선생님 생성 또는 조회
      teacher = await prisma.teacher.findFirst({
        where: { name: "김선생님" },
      });

      if (!teacher) {
        try {
          // 먼저 User 생성
          const teacherUser = await prisma.user.create({
            data: {
              name: "김선생님",
              email: "teacher@hanguru.school",
              password: "hashed_password_placeholder",
              role: "TEACHER",
              phone: "010-1234-5678",
            },
          });

          // Teacher 생성
          teacher = await prisma.teacher.create({
            data: {
              userId: teacherUser.id,
              name: "김선생님",
              kanjiName: "金先生",
              yomigana: "きむせんせい",
              koreanName: "김선생님",
              phone: "010-1234-5678",
              subjects: ["일본어"],
              hourlyRate: 30000,
            },
          });
          console.log("기본 선생님 생성 완료:", teacher.id);
        } catch (teacherError) {
          console.error("선생님 생성 실패:", teacherError);
          return NextResponse.json(
            { error: "선생님 정보를 생성할 수 없습니다." },
            { status: 500 },
          );
        }
      }
    }

    // 8. 중복 예약 확인
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        date: new Date(date),
        startTime: time,
        studentId: user.student.id,
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    });

    if (existingReservation) {
      console.log("중복 예약 발견:", existingReservation.id);
      return NextResponse.json(
        { error: "해당 시간에 이미 예약이 있습니다." },
        { status: 409 },
      );
    }

    // 9. 종료 시간 계산
    const getEndTime = (startTime: string, durationMinutes: number) => {
      const [hours, minutes] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      return endDate.toTimeString().slice(0, 5);
    };

    // 10. Location enum 변환
    const locationEnum =
      location === "온라인" ? Location.ONLINE : Location.OFFLINE;

    // 11. 예약 생성
    console.log("예약 생성 시작");
    const reservation = await prisma.reservation.create({
      data: {
        date: new Date(date),
        startTime: time,
        endTime: getEndTime(time, duration),
        location: locationEnum,
        notes: notes || "",
        status: ReservationStatus.CONFIRMED,
        studentId: user.student.id,
        teacherId: teacher.id,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        teacher: true,
      },
    });

    console.log("예약 생성 성공:", reservation.id);

    // 12. 알림 전송
    const notificationData = {
      ...reservation,
      student: {
        ...reservation.student,
        email: user.email,
      },
    };

    // 이메일 알림 (비동기)
    sendReservationNotification(notificationData).catch((error) => {
      console.error("이메일 알림 전송 실패:", error);
    });

    // LINE 알림 (비동기)
    sendLineNotification(notificationData).catch((error) => {
      console.error("LINE 알림 전송 실패:", error);
    });

    // 13. 성공 응답
    console.log("예약 생성 완료 - 성공 응답 반환");
    return NextResponse.json({
      success: true,
      message: "예약이 성공적으로 완료되었습니다.",
      reservation: {
        id: reservation.id,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        location: reservation.location,
        status: reservation.status,
        notes: reservation.notes,
        createdAt: reservation.createdAt,
        teacher: reservation.teacher,
      },
    });
  } catch (error) {
    console.error("=== 예약 생성 API 오류 ===");
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
      { error: "예약 생성 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

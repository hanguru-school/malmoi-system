import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { taggingSystem } from '@/lib/tagging-system';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, timestamp } = body;

    if (!uid || !timestamp) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // UID로 학생 조회
    const user = await prisma.user.findFirst({
      where: { uid },
      include: {
        student: true,
      }
    });

    if (!user || !user.student) {
      return NextResponse.json(
        { 
          success: false, 
          eventType: 'attendance',
          message: '등록되지 않은 학생입니다.' 
        },
        { status: 404 }
      );
    }

    // 태깅 시스템으로 처리
    const taggingResult = await taggingSystem.processTagging(
      uid,
      'device_001', // 기본 디바이스 ID
      'felica',
      {
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    if (!taggingResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          eventType: 'attendance',
          message: taggingResult.error || '태깅 처리에 실패했습니다.' 
        },
        { status: 500 }
      );
    }

    // 오늘 예약 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReservations = await prisma.reservation.findMany({
      where: {
        studentId: user.student.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: 'CONFIRMED',
      },
      include: {
        teacher: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 출석 상태 판단
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;

    let attendanceStatus: 'present' | 'late' | 'early' | 'absent' = 'present';
    let eventType: 'attendance' | 'checkout' | 're_attendance' = 'attendance';

    if (todayReservations.length > 0) {
      const firstReservation = todayReservations[0];
      const reservationTime = new Date(firstReservation.startTime);
      const reservationHour = reservationTime.getHours();
      const reservationMinute = reservationTime.getMinutes();
      const reservationTimeMinutes = reservationHour * 60 + reservationMinute;

      // 수업 시작 10분 전 ~ 10분 후: 정시
      if (Math.abs(currentTime - reservationTimeMinutes) <= 10) {
        attendanceStatus = 'present';
      }
      // 수업 시작 10분 후: 지각
      else if (currentTime > reservationTimeMinutes + 10) {
        attendanceStatus = 'late';
      }
      // 수업 시작 10분 전: 일찍
      else {
        attendanceStatus = 'early';
      }
    } else {
      attendanceStatus = 'absent';
    }

    // 포인트 적립 (출석 시)
    let pointsEarned = 0;
    if (attendanceStatus === 'present') {
      pointsEarned = 10;
      
      // 학생 포인트 업데이트
      await prisma.student.update({
        where: { id: user.student.id },
        data: {
          points: {
            increment: pointsEarned,
          },
        },
      });
    }

    // UID 태그 로그 저장
    await prisma.uIDTag.create({
      data: {
        userId: user.id,
        uid,
        tagType: eventType,
        deviceId: 'device_001',
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: user.student.id,
        name: user.student.name,
        uid,
      },
      eventType,
      attendanceStatus,
      message: getAttendanceMessage(attendanceStatus),
      todaySchedule: todayReservations.length > 0 ? {
        lessons: todayReservations.map(reservation => ({
          teacherName: reservation.teacher.name,
          time: new Date(reservation.startTime).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          duration: `${reservation.startTime} ~ ${reservation.endTime}`,
        })),
        totalLessons: todayReservations.length,
      } : null,
      pointsEarned,
      currentPoints: user.student.points + pointsEarned,
    });

  } catch (error) {
    console.error('Student tagging error:', error);
    return NextResponse.json(
      { 
        success: false, 
        eventType: 'attendance',
        message: '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

function getAttendanceMessage(status: string): string {
  switch (status) {
    case 'present':
      return '출석이 확인되었습니다!';
    case 'late':
      return '지각으로 처리되었습니다.';
    case 'early':
      return '일찍 오셨네요!';
    case 'absent':
      return '오늘 예약된 수업이 없습니다.';
    default:
      return '태그 처리 완료';
  }
} 
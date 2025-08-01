import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { taggingSystem } from '@/lib/tagging-system';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, timestamp, type } = body;

    if (!uid || !timestamp || !type) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // UID로 사용자 조회
    const user = await prisma.user.findFirst({
      where: { uid },
      include: {
        teacher: true,
        staff: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          eventType: 'attendance',
          message: '등록되지 않은 UID입니다.' 
        },
        { status: 404 }
      );
    }

    // 사용자 역할 확인
    let userRole: 'teacher' | 'staff';
    let employeeName: string;

    if (user.teacher) {
      userRole = 'teacher';
      employeeName = user.teacher.name;
    } else if (user.staff) {
      userRole = 'staff';
      employeeName = user.staff.name;
    } else {
      return NextResponse.json(
        { 
          success: false, 
          eventType: 'attendance',
          message: '직원 정보를 찾을 수 없습니다.' 
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

    // 출근/퇴근 상태 판단
    const now = new Date();
    const hour = now.getHours();
    let eventType: 'attendance' | 'checkout' | 're_attendance';
    
    if (hour < 12) {
      eventType = 'attendance';
    } else if (hour >= 18) {
      eventType = 'checkout';
    } else {
      eventType = 're_attendance';
    }

    // 오늘 스케줄 조회 (선생님인 경우)
    let todaySchedule = null;
    if (userRole === 'teacher' && user.teacher) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const reservations = await prisma.reservation.findMany({
        where: {
          teacherId: user.teacher.id,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          student: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      if (reservations.length > 0) {
        todaySchedule = {
          lessons: reservations.map(reservation => ({
            studentName: reservation.student.name,
            serviceName: '일반 수업', // 기본 서비스명
            time: new Date(reservation.startTime).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })),
          totalLessons: reservations.length,
        };
      }
    }

    // 교통비 지급 여부 확인 (직원인 경우)
    let transportationAllowance = null;
    if (userRole === 'staff') {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // 평일(월-금)이고 출근 시간이면 교통비 지급
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && eventType === 'attendance') {
        transportationAllowance = {
          eligible: true,
          amount: 1000, // 1,000원
          reason: '평일 출근 교통비',
        };
      } else {
        transportationAllowance = {
          eligible: false,
          amount: 0,
          reason: '주말 또는 퇴근 시간',
        };
      }
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
      employee: {
        id: user.id,
        name: employeeName,
        role: userRole,
        uid,
      },
      eventType,
      message: getEventMessage(eventType),
      todaySchedule,
      transportationAllowance,
    });

  } catch (error) {
    console.error('Employee tagging error:', error);
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

function getEventMessage(eventType: string): string {
  switch (eventType) {
    case 'attendance':
      return '출근이 확인되었습니다!';
    case 'checkout':
      return '퇴근이 확인되었습니다!';
    case 're_attendance':
      return '재출근이 확인되었습니다!';
    default:
      return '태그 처리 완료';
  }
} 
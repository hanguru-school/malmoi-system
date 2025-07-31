import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 세션에서 사용자 정보 가져오기
    const session = request.cookies.get('auth-session');
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      include: { student: true }
    });

    if (!user || !user.student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // 예약 조회 조건 설정
    const whereClause: any = {
      studentId: user.student.id
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      whereClause.status = status;
    }

    // 예약 조회
    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        teacher: true,
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // 응답 데이터 포맷팅
    const formattedReservations = reservations.map(reservation => ({
      id: reservation.id,
      date: reservation.date.toISOString().split('T')[0],
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      location: reservation.location,
      status: reservation.status,
      notes: reservation.notes,
      teacherName: reservation.teacher?.name || '미배정',
      studentName: reservation.student.user.name,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt
    }));

    return NextResponse.json({
      reservations: formattedReservations,
      total: formattedReservations.length
    });

  } catch (error) {
    console.error('예약 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '예약 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
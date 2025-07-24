import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/aws-rds';
import jwt from 'jsonwebtoken';

// JWT 토큰 검증 함수
function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 인증 토큰 확인
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const { roomId, startTime, endTime, title, description } = await request.json();

    // 입력 검증
    if (!roomId || !startTime || !endTime || !title) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 시간 형식 검증
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return NextResponse.json(
        { error: '과거 시간으로는 예약할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: '종료 시간은 시작 시간보다 늦어야 합니다.' },
        { status: 400 }
      );
    }

    // 예약 시간 제한 (최대 4시간)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 4) {
      return NextResponse.json(
        { error: '예약 시간은 최대 4시간까지 가능합니다.' },
        { status: 400 }
      );
    }

    // 예약 충돌 확인
    const hasConflict = await databaseService.checkReservationConflict(roomId, start, end);
    if (hasConflict) {
      return NextResponse.json(
        { error: '해당 시간에 이미 예약이 있습니다.' },
        { status: 409 }
      );
    }

    // 예약 생성
    const reservation = await databaseService.createReservation({
      userId: decoded.userId,
      roomId,
      startTime: start,
      endTime: end,
      title,
      description
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        roomId: reservation.room_id,
        startTime: reservation.start_time,
        endTime: reservation.end_time,
        title: reservation.title,
        description: reservation.description,
        status: reservation.status
      },
      message: '예약이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('예약 생성 오류:', error);
    return NextResponse.json(
      { error: '예약 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
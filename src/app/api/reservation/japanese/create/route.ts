import { NextRequest, NextResponse } from 'next/server';
import { createReservation } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, roomId, date, startTime, endTime, notes } = body;

    // 필수 필드 검증
    if (!userId || !courseId || !roomId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 예약 데이터 생성
    const reservationData = {
      userId,
      courseId,
      roomId,
      date: new Date(date),
      startTime,
      endTime,
      status: 'pending' as const,
      notes: notes || undefined
    };

    // Firebase에 예약 생성
    const reservationId = await createReservation(reservationData);

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 생성되었습니다',
      reservationId
    });

  } catch (error) {
    console.error('예약 생성 오류:', error);
    return NextResponse.json(
      { error: '예약 생성에 실패했습니다' },
      { status: 500 }
    );
  }
} 
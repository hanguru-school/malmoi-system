import { NextRequest, NextResponse } from 'next/server';
import { updateReservationStatus } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: '예약 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 예약 상태를 'cancelled'로 업데이트
    await updateReservationStatus(reservationId, 'cancelled');

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 취소되었습니다'
    });

  } catch (error) {
    console.error('예약 취소 오류:', error);
    return NextResponse.json(
      { error: '예약 취소에 실패했습니다' },
      { status: 500 }
    );
  }
} 
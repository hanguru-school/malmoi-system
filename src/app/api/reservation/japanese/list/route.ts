import { NextRequest, NextResponse } from 'next/server';
import { getAllReservations, getReservationsByUser } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let reservations;

    if (userId) {
      // 특정 사용자의 예약만 조회
      reservations = await getReservationsByUser(userId);
    } else {
      // 모든 예약 조회 (관리자용)
      reservations = await getAllReservations();
    }

    // 상태별 필터링
    if (status && status !== 'all') {
      reservations = reservations.filter(reservation => reservation.status === status);
    }

    // 날짜순 정렬 (최신순)
    reservations.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      success: true,
      reservations,
      total: reservations.length
    });

  } catch (error) {
    console.error('예약 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '예약 목록 조회에 실패했습니다' },
      { status: 500 }
    );
  }
} 
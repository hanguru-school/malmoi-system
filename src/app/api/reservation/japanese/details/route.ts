import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('id');

    if (!reservationId) {
      return NextResponse.json(
        { error: '예약 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // Firestore에서 예약 정보 조회
    const reservationDoc = await getDoc(doc(db, COLLECTIONS.RESERVATIONS, reservationId));
    
    if (!reservationDoc.exists()) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const reservationData = reservationDoc.data();

    // 관련 정보 조회 (코스, 교실, 사용자)
    const [courseDoc, roomDoc, userDoc] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.COURSES, reservationData.courseId)),
      getDoc(doc(db, COLLECTIONS.ROOMS, reservationData.roomId)),
      getDoc(doc(db, COLLECTIONS.USERS, reservationData.userId))
    ]);

    const reservation = {
      id: reservationDoc.id,
      ...reservationData,
      course: courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null,
      room: roomDoc.exists() ? { id: roomDoc.id, ...roomDoc.data() } : null,
      user: userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null
    };

    return NextResponse.json({
      success: true,
      reservation
    });

  } catch (error) {
    console.error('예약 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '예약 상세 조회에 실패했습니다' },
      { status: 500 }
    );
  }
} 
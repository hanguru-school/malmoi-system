import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

// Node.js 런타임 명시
export const runtime = 'nodejs';

// 데이터베이스 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// JWT 토큰 검증 함수
function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
}

// 예약 충돌 확인 함수
async function checkReservationConflict(roomId: string, startTime: Date, endTime: Date) {
  const query = `
    SELECT COUNT(*) as count
    FROM reservations
    WHERE room_id = $1
    AND status != 'cancelled'
    AND (
      (start_time <= $2 AND end_time > $2) OR
      (start_time < $3 AND end_time >= $3) OR
      (start_time >= $2 AND end_time <= $3)
    )
  `;
  
  const result = await pool.query(query, [roomId, startTime, endTime]);
  return parseInt(result.rows[0].count) > 0;
}

// 예약 생성 함수
async function createReservation(data: {
  userId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string;
}) {
  const query = `
    INSERT INTO reservations (user_id, room_id, start_time, end_time, title, description, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    data.userId,
    data.roomId,
    data.startTime,
    data.endTime,
    data.title,
    data.description || ''
  ]);
  
  return result.rows[0];
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    const { roomId, startTime, endTime, title, description } = await request.json();

    // Validation
    if (!roomId || !startTime || !endTime || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for reservation conflicts
    const hasConflict = await checkReservationConflict(
      roomId,
      new Date(startTime),
      new Date(endTime)
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Reservation time conflict detected' },
        { status: 409 }
      );
    }

    // Create reservation
    const reservation = await createReservation({
      userId: decoded.userId,
      roomId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      title,
      description
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        title: reservation.title,
        roomId: reservation.room_id,
        startTime: reservation.start_time,
        endTime: reservation.end_time,
        status: reservation.status,
        createdAt: reservation.created_at
      }
    });

  } catch (error) {
    console.error('Reservation creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
} 
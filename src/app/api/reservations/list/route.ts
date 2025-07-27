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
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// 사용자 예약 조회 함수
async function getUserReservations(userId: string, startDate?: Date, endDate?: Date) {
  let query = `
    SELECT r.*, rm.name as room_name
    FROM reservations r
    JOIN rooms rm ON r.room_id = rm.id
    WHERE r.user_id = $1
  `;
  
  const params: any[] = [userId];
  let paramIndex = 2;
  
  if (startDate) {
    query += ` AND r.start_time >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  
  if (endDate) {
    query += ` AND r.end_time <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }
  
  query += ` ORDER BY r.start_time DESC`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Get user reservations
    const reservations = await getUserReservations(
      decoded.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Filter by status if provided
    const filteredReservations = status && status !== 'all'
      ? reservations.filter(r => r.status === status)
      : reservations;

    return NextResponse.json({
      success: true,
      reservations: filteredReservations.map(reservation => ({
        id: reservation.id,
        title: reservation.title,
        description: reservation.description,
        roomId: reservation.room_id,
        roomName: reservation.room_name,
        startTime: reservation.start_time,
        endTime: reservation.end_time,
        status: reservation.status,
        createdAt: reservation.created_at,
        updatedAt: reservation.updated_at
      }))
    });

  } catch (error) {
    console.error('Reservation list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
} 
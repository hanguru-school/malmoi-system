import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/aws-rds';
import jwt from 'jsonwebtoken';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
  } catch (error) {
    throw new Error('Invalid token');
  }
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
    const reservations = await databaseService.getUserReservations(
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
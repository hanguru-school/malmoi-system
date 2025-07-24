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
    const hasConflict = await databaseService.checkReservationConflict(
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
    const reservation = await databaseService.createReservation({
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
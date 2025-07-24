import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/aws-rds';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Get rooms
    const rooms = await databaseService.getRooms();

    // Filter active rooms if requested
    const filteredRooms = activeOnly 
      ? rooms.filter(room => room.is_active)
      : rooms;

    return NextResponse.json({
      success: true,
      rooms: filteredRooms.map(room => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        description: room.description,
        isActive: room.is_active,
        createdAt: room.created_at
      }))
    });

  } catch (error) {
    console.error('Room list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
} 
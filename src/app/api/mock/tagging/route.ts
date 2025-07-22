import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock tagging data
    const mockTaggingData = {
      success: true,
      data: {
        recentTagging: [
          {
            id: '1',
            uid: 'ABCD1234567890EF',
            userId: 'USER001',
            userName: '김학생',
            timestamp: new Date().toISOString(),
            location: '교실 A',
            deviceId: 'DEVICE001'
          },
          {
            id: '2',
            uid: 'FEDCBA0987654321',
            userId: 'USER002',
            userName: '이선생님',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            location: '교실 B',
            deviceId: 'DEVICE002'
          }
        ],
        statistics: {
          totalTagging: 150,
          todayTagging: 25,
          activeUsers: 45,
          activeDevices: 3
        }
      }
    };

    return NextResponse.json(mockTaggingData);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tagging data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock tagging creation
    const mockResponse = {
      success: true,
      message: 'Tagging recorded successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        uid: body.uid,
        userId: body.userId,
        userName: body.userName,
        timestamp: new Date().toISOString(),
        location: body.location || 'Unknown',
        deviceId: body.deviceId || 'Unknown'
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record tagging' },
      { status: 500 }
    );
  }
} 
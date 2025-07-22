import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock notifications data
    const mockNotifications = {
      success: true,
      data: {
        notifications: [
          {
            id: '1',
            type: 'lesson_reminder',
            title: '수업 알림',
            message: '오늘 오후 2시에 수업이 있습니다.',
            isRead: false,
            createdAt: new Date().toISOString(),
            userId: 'USER001'
          },
          {
            id: '2',
            type: 'system',
            title: '시스템 업데이트',
            message: '새로운 기능이 추가되었습니다.',
            isRead: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            userId: 'USER001'
          }
        ],
        unreadCount: 1
      }
    };

    return NextResponse.json(mockNotifications);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock notification creation
    const mockResponse = {
      success: true,
      message: 'Notification created successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        type: body.type,
        title: body.title,
        message: body.message,
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: body.userId
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
} 
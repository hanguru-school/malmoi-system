import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { handleApiError, createSuccessResponse, checkDatabaseConnection } from '@/lib/api-utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Session API called');

    // 데이터베이스 연결 확인
    const dbCheck = await checkDatabaseConnection();
    if (!dbCheck.success) {
      console.error('Database connection failed:', dbCheck.error);
      return NextResponse.json({
        success: false,
        message: '데이터베이스 연결에 실패했습니다.',
        error: dbCheck.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // 사용자 수 조회
    const userCount = await prisma.user.count();

    return createSuccessResponse({
      loggedIn: true,
      userCount,
      timestamp: new Date().toISOString(),
      dbStatus: 'connected'
    }, '세션 정보를 성공적으로 가져왔습니다.');

  } catch (error) {
    console.error('Session API error:', error);
    return handleApiError(error, 'GET /api/auth/session');
  }
} 
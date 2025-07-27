import { NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  checkDatabaseConnection 
} from '@/lib/api-utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Session API called');
    
    // 데이터베이스 연결 확인
    const dbCheck = await checkDatabaseConnection();
    if (!dbCheck.success) {
      console.error('Database connection failed:', dbCheck.error);
      return createErrorResponse(
        '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
        500,
        dbCheck.error
      );
    }

    // 세션 정보 생성 (실제 구현에서는 JWT 토큰에서 추출)
    const session = {
      loggedIn: true,
      user: {
        id: 'session-user-id',
        email: 'user@example.com',
        name: '사용자',
        role: 'STUDENT'
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후
    };

    console.log('Session created successfully');
    return createSuccessResponse(session, '세션 정보를 성공적으로 가져왔습니다.');

  } catch (error: any) {
    console.error('Session API error:', error);
    return createErrorResponse(
      '세션 정보를 가져오는 중 오류가 발생했습니다.',
      500,
      error.message || 'SESSION_ERROR'
    );
  }
} 
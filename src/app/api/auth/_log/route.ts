import { NextResponse } from 'next/server';
import { handleApiError, createSuccessResponse, checkDatabaseConnection } from '@/lib/api-utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Auth log API called');

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

    // 로그 정보 생성
    const log = {
      action: 'auth_log_access',
      timestamp: new Date().toISOString(),
      message: 'Authentication log endpoint accessed successfully',
      status: 'success',
      dbStatus: 'connected'
    };

    console.log('Auth log created successfully');
    return createSuccessResponse(log, '인증 로그를 성공적으로 가져왔습니다.');

  } catch (error) {
    console.error('Auth log API error:', error);
    return handleApiError(error, 'GET /api/auth/_log');
  }
}

export async function POST(req: Request) {
  try {
    console.log('Auth log POST API called');

    // 요청 본문 파싱
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.warn('Failed to parse request body:', parseError);
      body = {};
    }

    console.log('Received log data:', body);

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

    // 로그 데이터 처리 (실제 구현에서는 데이터베이스에 저장)
    const processedLog = {
      ...body,
      receivedAt: new Date().toISOString(),
      processed: true,
      dbStatus: 'connected'
    };

    console.log('Log data processed successfully');
    return createSuccessResponse(processedLog, '로그 데이터를 성공적으로 처리했습니다.');

  } catch (error) {
    console.error('Auth log POST API error:', error);
    return handleApiError(error, 'POST /api/auth/_log');
  }
} 
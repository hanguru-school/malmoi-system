import { NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    console.log('Auth error API called');
    
    const { searchParams } = new URL(request.url);
    const errorType = searchParams.get('error') || 'unknown';
    const errorMessage = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';

    console.log('Error type:', errorType, 'Message:', errorMessage);

    // 에러 타입별 메시지 매핑
    const errorMessages: Record<string, string> = {
      'invalid_credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'user_not_found': '등록되지 않은 사용자입니다.',
      'account_locked': '계정이 잠겨있습니다. 관리자에게 문의하세요.',
      'session_expired': '세션이 만료되었습니다. 다시 로그인해주세요.',
      'database_error': '데이터베이스 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      'network_error': '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
      'server_error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      'unknown': '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    };

    const message = errorMessages[errorType] || errorMessage;

    return createErrorResponse(
      message,
      400,
      errorType.toUpperCase()
    );

  } catch (error: any) {
    console.error('Auth error API error:', error);
    return createErrorResponse(
      '오류 처리 중 문제가 발생했습니다.',
      500,
      error.message || 'ERROR_API_ERROR'
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Auth error POST API called');
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.warn('Failed to parse request body:', parseError);
      body = {};
    }

    const { errorType = 'unknown', message = '알 수 없는 오류가 발생했습니다.' } = body;

    console.log('Error details:', { errorType, message });

    // 에러 로깅 (실제 구현에서는 데이터베이스에 저장)
    const errorLog = {
      errorType,
      message,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    };

    console.error('Auth error logged:', errorLog);

    return createErrorResponse(
      message,
      400,
      errorType.toUpperCase()
    );

  } catch (error: any) {
    console.error('Auth error POST API error:', error);
    return createErrorResponse(
      '오류 처리 중 문제가 발생했습니다.',
      500,
      error.message || 'ERROR_API_POST_ERROR'
    );
  }
} 
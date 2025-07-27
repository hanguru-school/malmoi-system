import { NextResponse } from 'next/server';

// 환경변수 검증 함수
export function validateEnvironmentVariables() {
  const missingVars: string[] = [];
  
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  };

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key);
    }
  });

  return {
    isValid: missingVars.length === 0,
    missingVars,
    details: requiredVars
  };
}

// 표준화된 에러 응답 함수
export function createErrorResponse(
  message: string, 
  status: number = 500, 
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    },
    { status }
  );
}

// 성공 응답 함수
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// API 래퍼 함수 (에러 핸들링 포함)
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  errorMessage: string = 'Internal server error'
): Promise<NextResponse> {
  try {
    const result = await handler();
    return createSuccessResponse(result);
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // 데이터베이스 연결 오류 체크
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('ENOTFOUND') ||
          error.message.includes('timeout')) {
        return createErrorResponse(
          'Database connection failed',
          503,
          { originalError: error.message }
        );
      }
      
      if (error.message.includes('AWS') || 
          error.message.includes('Cognito') ||
          error.message.includes('S3')) {
        return createErrorResponse(
          'AWS service connection failed',
          503,
          { originalError: error.message }
        );
      }
    }
    
    return createErrorResponse(errorMessage, 500, {
      originalError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 인증 관련 에러 응답
export function createAuthErrorResponse(
  message: string = 'Authentication failed',
  status: number = 401
) {
  return createErrorResponse(message, status, {
    type: 'authentication_error',
    timestamp: new Date().toISOString()
  });
}

// 권한 관련 에러 응답
export function createPermissionErrorResponse(
  message: string = 'Permission denied',
  status: number = 403
) {
  return createErrorResponse(message, status, {
    type: 'permission_error',
    timestamp: new Date().toISOString()
  });
} 
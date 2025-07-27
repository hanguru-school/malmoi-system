import { NextResponse } from 'next/server';

export function handleApiError(error: any, status: number = 500) {
  console.error('API Error:', error);

  return NextResponse.json(
    {
      error: error?.message || '서버 오류가 발생했습니다.',
      details: error?.stack || null,
    },
    { status }
  );
}

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
    return handleApiError(error, 500);
  }
} 
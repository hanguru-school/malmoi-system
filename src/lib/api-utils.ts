import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 표준화된 API 응답 인터페이스
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// 성공 응답 함수
export function createSuccessResponse<T>(data: T, message: string = 'Success'): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return NextResponse.json(response, { status: 200 });
}

// 에러 응답 함수
export function createErrorResponse(message: string, status: number = 500, error?: string): NextResponse<ApiResponse> {
  console.error('API Error:', { message, error, status });
  
  const response: ApiResponse = {
    success: false,
    message,
    error: error || 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status });
}

// 기존 handleApiError 함수 개선
export function handleApiError(error: any, status: number = 500) {
  console.error('API Error:', error);
  
  const message = error?.message || '서버 오류가 발생했습니다.';
  const errorDetails = error?.stack || error?.code || 'UNKNOWN_ERROR';
  
  return createErrorResponse(message, status, errorDetails);
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

// API 래퍼 함수 (에러 핸들링 포함)
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  successMessage: string = 'Operation completed successfully'
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await handler();
    return createSuccessResponse(result, successMessage);
  } catch (error: any) {
    return handleApiError(error, 500);
  }
}

// 데이터베이스 연결 확인 함수
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    
    // 간단한 쿼리로 연결 테스트
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      success: true,
      message: '데이터베이스 연결이 정상입니다.'
    };
  } catch (error: any) {
    console.error('Database connection check failed:', error);
    return {
      success: false,
      message: '데이터베이스 연결에 실패했습니다.',
      error: error.message || 'DB_CONNECTION_FAILED'
    };
  }
} 
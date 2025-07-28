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

// 개선된 에러 핸들러 - 항상 JSON 응답 보장
export function handleApiError(error: unknown, context: string) {
  console.error(`[${context}]`, error);

  // 에러 타입에 따른 적절한 메시지 생성
  let errorMessage = '알 수 없는 오류가 발생했습니다.';
  let statusCode = 500;

  if (error instanceof Error) {
    errorMessage = error.message;
    
    // 특정 에러 타입에 따른 상태 코드 설정
    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      statusCode = 403;
      errorMessage = '접근 권한이 없습니다.';
    } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      statusCode = 401;
      errorMessage = '인증이 필요합니다.';
    } else if (error.message.includes('Not Found') || error.message.includes('404')) {
      statusCode = 404;
      errorMessage = '요청한 리소스를 찾을 수 없습니다.';
    } else if (error.message.includes('Bad Request') || error.message.includes('400')) {
      statusCode = 400;
      errorMessage = '잘못된 요청입니다.';
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  );
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

// 환경변수 검증 함수
export function validateEnvironmentVariables() {
  const missingVars: string[] = [];

  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AWS_REGION: process.env.AWS_REGION,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    JWT_SECRET: process.env.JWT_SECRET,
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
  successMessage: string = 'Operation completed successfully',
  context: string = 'API'
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await handler();
    return createSuccessResponse(result, successMessage);
  } catch (error) {
    return handleApiError(error, context);
  }
}

// 데이터베이스 연결 확인 함수
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    return {
      success: true,
      message: '데이터베이스 연결이 정상입니다.'
    };
  } catch (error) {
    console.error('Database connection check failed:', error);
    return {
      success: false,
      message: '데이터베이스 연결에 실패했습니다.',
      error: error instanceof Error ? error.message : 'DB_CONNECTION_FAILED'
    };
  }
}

// AWS Cognito 연결 확인 함수
export async function checkCognitoConnection() {
  try {
    const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    if (!process.env.AWS_REGION || !process.env.COGNITO_CLIENT_ID) {
      return {
        success: false,
        message: 'AWS Cognito 환경변수가 설정되지 않았습니다.',
        error: 'MISSING_ENV_VARS'
      };
    }

    const cognitoClient = new CognitoIdentityProviderClient({ 
      region: process.env.AWS_REGION 
    });

    // Cognito User Pool 정보 조회 시도
    if (process.env.AWS_COGNITO_USER_POOL_ID) {
      await cognitoClient.send(
        new DescribeUserPoolCommand({
          UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID
        })
      );
    }

    return {
      success: true,
      message: 'AWS Cognito 연결이 정상입니다.'
    };
  } catch (error) {
    console.error('Cognito connection check failed:', error);
    return {
      success: false,
      message: 'AWS Cognito 연결에 실패했습니다.',
      error: error instanceof Error ? error.message : 'COGNITO_CONNECTION_FAILED'
    };
  }
} 
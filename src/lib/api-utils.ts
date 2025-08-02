import { NextResponse } from "next/server";
import { checkPrismaConnection } from "@/lib/db";

// 표준화된 API 응답 인터페이스
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// 간단한 에러 핸들러 (User provided, adapted to ApiResponse interface)
export function handleApiError(
  error: unknown,
  statusCode: string | number = "500",
) {
  console.error("[API ERROR]", error);
  const status = typeof statusCode === 'string' ? parseInt(statusCode, 10) : statusCode;
  return NextResponse.json(
    {
      success: false,
      message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

// 성공 응답 함수
export function createSuccessResponse<T>(
  data: T,
  message: string = "Success",
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(response, { status: 200 });
}

// 환경변수 검증 함수
export function validateEnvironmentVariables() {
  const missingVars: string[] = [];

  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
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
    details: requiredVars,
  };
}

// API 래퍼 함수 (에러 핸들링 포함)
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  successMessage: string = "Operation completed successfully",
  context: string = "API",
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
  return await checkPrismaConnection();
}

// AWS Cognito 연결 확인 함수
export async function checkCognitoConnection() {
  try {
    const { CognitoIdentityProviderClient, DescribeUserPoolCommand } =
      await import("@aws-sdk/client-cognito-identity-provider");

    if (!process.env.AWS_REGION || !process.env.COGNITO_CLIENT_ID) {
      return {
        success: false,
        message: "AWS Cognito 환경변수가 설정되지 않았습니다.",
        error: "MISSING_ENV_VARS",
      };
    }

    const cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
    });

    // Cognito User Pool 정보 조회 시도
    if (process.env.AWS_COGNITO_USER_POOL_ID) {
      try {
        await cognitoClient.send(
          new DescribeUserPoolCommand({
            UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
          }),
        );
      } catch (error: any) {
        // User Pool이 존재하지 않아도 시스템은 정상 작동
        return {
          success: false,
          message:
            "AWS Cognito User Pool이 설정되지 않았습니다. (시스템은 정상 작동)",
          error: "USER_POOL_NOT_FOUND",
        };
      }
    }

    return {
      success: true,
      message: "AWS Cognito 연결이 정상입니다.",
    };
  } catch (error) {
    console.error("Cognito connection check failed:", error);
    return {
      success: false,
      message: "AWS Cognito 연결에 실패했습니다. (시스템은 정상 작동)",
      error:
        error instanceof Error ? error.message : "COGNITO_CONNECTION_FAILED",
    };
  }
}

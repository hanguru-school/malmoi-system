import { NextResponse } from 'next/server';
import { handleApiError, createSuccessResponse, checkDatabaseConnection, checkCognitoConnection, validateEnvironmentVariables } from '@/lib/api-utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Healthcheck API called');

    // 환경변수 검증
    const envValidation = validateEnvironmentVariables();
    
    // 데이터베이스 연결 테스트
    const dbCheck = await checkDatabaseConnection();
    
    // AWS Cognito 연결 테스트
    const cognitoCheck = await checkCognitoConnection();

    const healthData = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isValid: envValidation.isValid,
        missingVars: envValidation.missingVars
      },
      database: {
        status: dbCheck.success ? 'connected' : 'failed',
        message: dbCheck.message,
        error: dbCheck.error || null
      },
      cognito: {
        status: cognitoCheck.success ? 'connected' : 'failed',
        message: cognitoCheck.message,
        error: cognitoCheck.error || null
      },
      overall: {
        status: dbCheck.success && cognitoCheck.success && envValidation.isValid ? 'healthy' : 'unhealthy',
        message: '시스템 상태 확인 완료'
      }
    };

    console.log('Healthcheck completed successfully');
    return createSuccessResponse(healthData, '시스템 상태 확인이 완료되었습니다.');

  } catch (error) {
    console.error('Healthcheck API error:', error);
    return handleApiError(error, 'GET /api/healthcheck');
  }
} 
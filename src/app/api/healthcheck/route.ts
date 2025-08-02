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
      system: {
        name: 'Hanguru School Booking System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      infrastructure: {
        platform: 'Vercel',
        domain: 'https://app.hanguru.school',
        database: 'AWS RDS PostgreSQL 17.4',
        authentication: 'AWS Cognito',
        region: process.env.AWS_REGION || 'ap-northeast-1'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isValid: envValidation.isValid,
        missingVars: envValidation.missingVars,
        totalVars: Object.keys(envValidation.details).length
      },
      database: {
        status: dbCheck.success ? 'connected' : 'failed',
        message: dbCheck.message,
        error: dbCheck.error || null,
        host: process.env.DB_HOST || 'malmoi-system-db.crooggsemeim.ap-northeast-1.rds.amazonaws.com'
      },
      cognito: {
        status: cognitoCheck.success ? 'connected' : 'failed',
        message: cognitoCheck.message,
        error: cognitoCheck.error || null,
        userPoolId: process.env.COGNITO_USER_POOL_ID || 'ap-northeast-1_wtjdDdEJ5'
      },
      overall: {
        status: dbCheck.success && cognitoCheck.success && envValidation.isValid ? 'healthy' : 'unhealthy',
        message: '시스템 상태 확인 완료',
        checks: {
          environment: envValidation.isValid,
          database: dbCheck.success,
          cognito: cognitoCheck.success
        }
      }
    };

    console.log('Healthcheck completed successfully');
    return createSuccessResponse(healthData, '시스템 상태 확인이 완료되었습니다.');

  } catch (error) {
    console.error('Healthcheck API error:', error);
    return handleApiError(error, 'GET /api/healthcheck');
  }
} 
import { NextResponse } from 'next/server';
import { handleApiError, createSuccessResponse, checkDatabaseConnection, checkCognitoConnection, validateEnvironmentVariables } from '@/lib/api-utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('System status API called');

    // 모든 시스템 컴포넌트 상태 확인
    const envValidation = validateEnvironmentVariables();
    const dbCheck = await checkDatabaseConnection();
    const cognitoCheck = await checkCognitoConnection();

    // 시스템 메트릭 수집
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    const statusData = {
      timestamp: new Date().toISOString(),
      system: {
        name: 'Hanguru School Booking System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(systemMetrics.uptime),
        memory: {
          used: Math.round(systemMetrics.memory.used / 1024 / 1024),
          total: Math.round(systemMetrics.memory.heapTotal / 1024 / 1024),
          external: Math.round(systemMetrics.memory.external / 1024 / 1024)
        }
      },
      infrastructure: {
        platform: 'Vercel',
        domain: 'https://app.hanguru.school',
        database: {
          type: 'AWS RDS PostgreSQL 17.4',
          host: process.env.DB_HOST || 'malmoi-system-db.crooggsemeim.ap-northeast-1.rds.amazonaws.com',
          status: dbCheck.success ? 'healthy' : 'unhealthy'
        },
        authentication: {
          type: 'AWS Cognito',
          userPoolId: process.env.COGNITO_USER_POOL_ID || 'ap-northeast-1_wtjdDdEJ5',
          status: cognitoCheck.success ? 'healthy' : 'unhealthy'
        },
        region: process.env.AWS_REGION || 'ap-northeast-1'
      },
      components: {
        environment: {
          status: envValidation.isValid ? 'healthy' : 'unhealthy',
          missingVars: envValidation.missingVars,
          totalVars: Object.keys(envValidation.details).length
        },
        database: {
          status: dbCheck.success ? 'healthy' : 'unhealthy',
          message: dbCheck.message,
          error: dbCheck.error || null
        },
        cognito: {
          status: cognitoCheck.success ? 'healthy' : 'unhealthy',
          message: cognitoCheck.message,
          error: cognitoCheck.error || null
        }
      },
      overall: {
        status: dbCheck.success && cognitoCheck.success && envValidation.isValid ? 'healthy' : 'degraded',
        message: '시스템 상태 모니터링 완료',
        healthScore: Math.round(
          ([envValidation.isValid, dbCheck.success, cognitoCheck.success].filter(Boolean).length / 3) * 100
        )
      }
    };

    console.log('System status check completed successfully');
    return createSuccessResponse(statusData, '시스템 상태 모니터링이 완료되었습니다.');

  } catch (error) {
    console.error('System status API error:', error);
    return handleApiError(error, '시스템 상태 확인 중 오류가 발생했습니다.');
  }
} 
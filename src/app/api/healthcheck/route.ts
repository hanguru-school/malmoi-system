import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { 
  handleApiError, 
  validateEnvironmentVariables
} from '@/lib/api-utils';
import { checkDbConnection } from '@/lib/db';

// Node.js 런타임 명시
export const runtime = 'nodejs';

// 체크 결과 타입 정의
interface CheckResult {
  status: 'healthy' | 'unhealthy' | 'error';
  message: string;
  error?: string;
  details?: any;
}

export async function GET(request: NextRequest) {
  try {
    const healthReport = {
      status: 'checking' as string,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        runtime: 'nodejs'
      },
      checks: {
        environment: null as CheckResult | null,
        database: null as CheckResult | null,
        aws: null as CheckResult | null,
        jwt: null as CheckResult | null
      },
      summary: {
        totalChecks: 4,
        passedChecks: 0,
        failedChecks: 0,
        successRate: 0
      }
    };

    // 1. 환경변수 체크
    try {
      const envCheck = validateEnvironmentVariables();
      healthReport.checks.environment = {
        status: envCheck.isValid ? 'healthy' : 'unhealthy',
        message: envCheck.isValid 
          ? 'All required environment variables are set' 
          : `Missing variables: ${envCheck.missingVars.join(', ')}`,
        details: envCheck.details
      };
      if (envCheck.isValid) healthReport.summary.passedChecks++;
      else healthReport.summary.failedChecks++;
    } catch (error) {
      healthReport.checks.environment = {
        status: 'error',
        message: 'Environment check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      healthReport.summary.failedChecks++;
    }

    // 2. 데이터베이스 연결 체크
    try {
      const isConnected = await checkDbConnection();
      
      if (isConnected) {
        healthReport.checks.database = {
          status: 'healthy',
          message: 'Database connection successful',
          details: {
            connection: 'active'
          }
        };
        healthReport.summary.passedChecks++;
      } else {
        healthReport.checks.database = {
          status: 'unhealthy',
          message: 'Database connection failed',
          details: {
            connection: 'failed'
          }
        };
        healthReport.summary.failedChecks++;
      }
    } catch (error) {
      healthReport.checks.database = {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          connection: 'failed'
        }
      };
      healthReport.summary.failedChecks++;
    }

    // 3. AWS 서비스 체크
    try {
      AWS.config.update({
        region: process.env.AWS_REGION || 'ap-northeast-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      
      const s3 = new AWS.S3();
      const buckets = await s3.listBuckets().promise();
      
      healthReport.checks.aws = {
        status: 'healthy',
        message: 'AWS services connection successful',
        details: {
          region: process.env.AWS_REGION,
          bucketCount: buckets.Buckets?.length || 0
        }
      };
      healthReport.summary.passedChecks++;
    } catch (error) {
      healthReport.checks.aws = {
        status: 'unhealthy',
        message: 'AWS services connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          region: process.env.AWS_REGION
        }
      };
      healthReport.summary.failedChecks++;
    }

    // 4. JWT 토큰 체크
    try {
      const testPayload = { test: 'healthcheck', timestamp: Date.now() };
      const token = jwt.sign(testPayload, process.env.NEXTAUTH_SECRET || 'fallback', {
        expiresIn: '1m'
      });
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback');
      
      healthReport.checks.jwt = {
        status: 'healthy',
        message: 'JWT token generation and verification successful',
        details: {
          tokenLength: token.length,
          decoded: decoded
        }
      };
      healthReport.summary.passedChecks++;
    } catch (error) {
      healthReport.checks.jwt = {
        status: 'unhealthy',
        message: 'JWT token operation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      healthReport.summary.failedChecks++;
    }

    // 5. 전체 상태 계산
    healthReport.summary.successRate = Math.round(
      (healthReport.summary.passedChecks / healthReport.summary.totalChecks) * 100
    );
    
    healthReport.status = healthReport.summary.failedChecks === 0 ? 'healthy' : 'unhealthy';

    return NextResponse.json(healthReport);
  } catch (error) {
    return handleApiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Health check POST endpoint',
      receivedData: body,
      timestamp: new Date().toISOString(),
      note: 'Use GET method for comprehensive health check'
    });
  } catch (error) {
    return handleApiError(error, 500);
  }
} 
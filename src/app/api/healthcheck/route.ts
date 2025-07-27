import { NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  handleApiError 
} from '@/lib/api-utils';
import prisma from '@/lib/db';
import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

// 데이터베이스 연결 확인 함수
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// AWS Cognito 연결 테스트
async function testAwsConnection() {
  try {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return { status: 'missing', message: 'AWS 환경변수 누락' };
    }

    AWS.config.update({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    // S3 연결 테스트 (가장 기본적인 AWS 서비스)
    const s3 = new AWS.S3();
    await s3.listBuckets().promise();

    // Cognito User Pool 연결 테스트 (선택적)
    if (process.env.AWS_COGNITO_USER_POOL_ID) {
      const cognito = new AWS.CognitoIdentityServiceProvider();
      await cognito.describeUserPool({
        UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID
      }).promise();
      return { status: 'connected', message: 'AWS Cognito + S3 연결 성공' };
    }

    return { status: 'connected', message: 'AWS S3 연결 성공' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      status: 'failed', 
      message: `AWS 연결 실패: ${errorMessage}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

// JWT 토큰 테스트
async function testJwtToken() {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return { status: 'missing', message: 'JWT 시크릿 키 누락' };
    }

    // 테스트 페이로드 생성
    const testPayload = {
      userId: 'healthcheck-test',
      role: 'admin',
      timestamp: Date.now()
    };

    // JWT 토큰 생성
    const token = jwt.sign(testPayload, secret, { expiresIn: '1m' });
    
    // JWT 토큰 검증
    const decoded = jwt.verify(token, secret);
    
    return { 
      status: 'connected', 
      message: 'JWT 토큰 생성/검증 성공',
      details: {
        tokenLength: token.length,
        decoded: decoded
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      status: 'failed', 
      message: `JWT 테스트 실패: ${errorMessage}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export async function GET() {
  try {
    console.log('Healthcheck API called');
    
    // 데이터베이스 연결 테스트
    const dbOk = await checkDbConnection();
    const dbStatus = dbOk ? 'connected' : 'failed';

    // AWS Cognito 연결 테스트
    const awsResult = await testAwsConnection();
    
    // JWT 토큰 테스트
    const jwtResult = await testJwtToken();

    const healthData = {
      timestamp: new Date().toISOString(),
      db: dbStatus,
      aws: awsResult.status,
      jwt: jwtResult.status,
      details: {
        aws: awsResult.message,
        jwt: jwtResult.message,
        aws_error: awsResult.error || null,
        jwt_error: jwtResult.error || null
      }
    };

    console.log('Healthcheck completed successfully');
    return createSuccessResponse(healthData, '시스템 상태 확인이 완료되었습니다.');

  } catch (error) {
    return handleApiError(error, 'Healthcheck API');
  }
} 
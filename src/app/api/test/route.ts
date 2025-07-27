import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { Pool } from 'pg';

// Prisma 인스턴스 생성
const prisma = new PrismaClient();

// PostgreSQL 연결 설정 (기존 방식)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Node.js 런타임 명시
export const runtime = 'nodejs';

export async function GET() {
  const report: any = {
    database: {
      prisma: null,
      postgresql: null,
    },
    aws: null,
    jwt: null,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not Set',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not Set',
    },
    timestamp: new Date().toISOString(),
    runtime: 'nodejs',
    success: true,
  };

  // 1) Prisma DB 연결 테스트
  try {
    await prisma.$connect();
    const usersCount = await prisma.user.count();
    report.database.prisma = `✅ Prisma 연결 성공 (${usersCount}명의 유저 존재)`;
  } catch (err: any) {
    report.database.prisma = `❌ Prisma 연결 실패: ${err.message}`;
    report.success = false;
  } finally {
    await prisma.$disconnect();
  }

  // 2) PostgreSQL 직접 연결 테스트
  try {
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    report.database.postgresql = `✅ PostgreSQL 직접 연결 성공 (${result.rows[0].user_count}명의 유저, 시간: ${result.rows[0].current_time})`;
  } catch (err: any) {
    console.error('PostgreSQL connection error:', err);
    report.database.postgresql = `❌ PostgreSQL 직접 연결 실패: ${err.message}`;
    report.success = false;
  }

  // 3) AWS Cognito/S3 테스트
  try {
    AWS.config.update({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    const s3 = new AWS.S3();
    await s3.listBuckets().promise(); // 접근 가능한지 확인
    report.aws = `✅ AWS 자격 증명 및 S3 연결 성공`;
  } catch (err: any) {
    console.error('AWS connection error:', err);
    report.aws = `❌ AWS 연결 실패: ${err.message}`;
    report.success = false;
  }

  // 4) JWT 생성/검증 테스트
  try {
    const testPayload = { 
      test: 'ok', 
      timestamp: new Date().toISOString(),
      userId: 'test-user-123'
    };
    const token = jwt.sign(testPayload, process.env.NEXTAUTH_SECRET || 'fallback-secret', {
      expiresIn: '1m',
    });
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
    report.jwt = `✅ JWT 발급 및 검증 성공 (토큰 길이: ${token.length}자, 만료: ${decoded.exp})`;
  } catch (err: any) {
    console.error('JWT test error:', err);
    report.jwt = `❌ JWT 실패: ${err.message}`;
    report.success = false;
  }

  // 5) 전체 시스템 상태 요약
  const allTests = [
    report.database.prisma,
    report.database.postgresql,
    report.aws,
    report.jwt
  ];
  
  const passedTests = allTests.filter(test => test && test.includes('✅')).length;
  const totalTests = allTests.filter(test => test).length;
  
  report.summary = {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
    status: report.success ? 'All systems operational' : 'Some systems have issues'
  };

  return NextResponse.json(report, { 
    status: report.success ? 200 : 503 
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'POST request received',
      data: body,
      timestamp: new Date().toISOString(),
      runtime: 'nodejs'
    });

  } catch (error) {
    console.error('Test POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test POST failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
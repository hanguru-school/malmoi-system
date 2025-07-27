import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { checkDbConnection } from '@/lib/db';

export const runtime = 'nodejs'; // App Router에서 Node.js 런타임 강제

export async function GET() {
  const report: any = {
    database: null,
    aws: null,
    jwt: null,
    timestamp: new Date().toISOString(),
  };

  // 1) DB 연결 테스트
  try {
    const isConnected = await checkDbConnection();
    if (isConnected) {
      report.database = `✅ DB 연결 성공`;
    } else {
      report.database = `❌ DB 연결 실패`;
    }
  } catch (err: any) {
    report.database = `❌ DB 연결 실패: ${err.message}`;
  }

  // 2) AWS Cognito (혹은 S3 등) 테스트
  try {
    AWS.config.update({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    const s3 = new AWS.S3();
    await s3.listBuckets().promise(); // 접근 가능한지 확인
    report.aws = `✅ AWS 자격 증명 및 연결 성공`;
  } catch (err: any) {
    report.aws = `❌ AWS 연결 실패: ${err.message}`;
  }

  // 3) JWT 생성/검증 테스트
  try {
    const token = jwt.sign({ test: 'ok' }, process.env.NEXTAUTH_SECRET || 'fallback', {
      expiresIn: '1m',
    });
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback');
    report.jwt = `✅ JWT 발급 및 검증 성공 (${JSON.stringify(decoded)})`;
  } catch (err: any) {
    report.jwt = `❌ JWT 실패: ${err.message}`;
  }

  return NextResponse.json(report, { status: 200 });
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
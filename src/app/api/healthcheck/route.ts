import { NextResponse } from 'next/server';
import prisma, { checkDbConnection } from '@/lib/db';

export async function GET() {
  const dbOk = await checkDbConnection();

  // AWS Cognito, JWT 체크는 필요 시 아래에 추가 가능
  const awsOk = !!process.env.AWS_REGION;
  const jwtOk = !!process.env.JWT_SECRET;

  return NextResponse.json({
    db: dbOk ? 'connected' : 'failed',
    aws: awsOk ? 'configured' : 'missing',
    jwt: jwtOk ? 'configured' : 'missing',
  });
} 
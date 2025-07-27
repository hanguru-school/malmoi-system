import { NextResponse } from 'next/server';

// Node.js 런타임 명시
export const runtime = 'nodejs';

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasAwsRegion: !!process.env.AWS_REGION,
        hasAwsRdsHost: !!process.env.AWS_RDS_HOST,
      },
      database: {
        status: 'unknown',
        error: null as string | null
      }
    };

    // 데이터베이스 연결 테스트
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.database.status = 'connected';
    } catch (dbError) {
      healthCheck.database.status = 'error';
      healthCheck.database.error = dbError instanceof Error ? dbError.message : 'Unknown error';
    }

    return NextResponse.json(healthCheck);
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
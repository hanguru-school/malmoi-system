import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Node.js 런타임 명시
export const runtime = 'nodejs';

// 데이터베이스 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(request: NextRequest) {
  try {
    // 환경변수 확인
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AWS_REGION: process.env.AWS_REGION,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
    };

    // 데이터베이스 연결 테스트
    let dbStatus = 'Unknown';
    try {
      const result = await pool.query('SELECT NOW() as current_time');
      dbStatus = 'Connected';
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      dbStatus = 'Failed';
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
      runtime: 'nodejs',
      message: 'API is working correctly'
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'POST request received',
      data: body,
      timestamp: new Date().toISOString()
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
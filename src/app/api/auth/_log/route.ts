import { NextResponse } from 'next/server';
import prisma, { checkDbConnection } from '@/lib/db';
import { handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const isDbConnected = await checkDbConnection();
    if (!isDbConnected) {
      return NextResponse.json({ error: 'DB 연결 실패' }, { status: 500 });
    }

    // 로그 예시
    const log = { 
      action: 'auth_log_access', 
      timestamp: new Date().toISOString(),
      message: 'Authentication log endpoint accessed'
    };
    return NextResponse.json(log);
  } catch (error) {
    return handleApiError(error);
  }
} 
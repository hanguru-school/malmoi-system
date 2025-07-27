import { NextResponse } from 'next/server';
import prisma, { checkDbConnection } from '@/lib/db';
import { handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const isDbConnected = await checkDbConnection();
    if (!isDbConnected) {
      return NextResponse.json({ error: 'DB 연결 실패' }, { status: 500 });
    }

    // 세션 예시 (실제 구현은 JWT 또는 AWS Cognito에서 가져옴)
    const session = { loggedIn: true, user: null };
    return NextResponse.json(session);
  } catch (error) {
    return handleApiError(error);
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    // 예시: DB 연결 확인 및 세션 정보 확인
    const userCount = await prisma.user.count();
    return NextResponse.json({ success: true, message: '세션 정상', userCount });
  } catch (error) {
    return handleApiError(error, 'GET /api/auth/session');
  }
} 
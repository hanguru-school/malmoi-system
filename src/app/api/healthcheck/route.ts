import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      success: true,
      message: '서버 정상 동작',
      userCount,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'DB 연결 실패' }, { status: 500 });
  }
} 
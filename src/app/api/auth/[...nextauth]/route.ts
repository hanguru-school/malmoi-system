import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

// Node.js 런타임 명시
export const runtime = 'nodejs';

// 동적 import로 authOptions 로드
async function getAuthOptions() {
  try {
    const { authOptions } = await import('@/lib/auth');
    return authOptions;
  } catch (error) {
    console.error('AuthOptions 로드 오류:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const authOptions = await getAuthOptions();
    return NextAuth(authOptions)(request);
  } catch (error) {
    console.error('NextAuth GET 오류:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authOptions = await getAuthOptions();
    return NextAuth(authOptions)(request);
  } catch (error) {
    console.error('NextAuth POST 오류:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

// 동적 import로 Prisma 로드
let prisma: any;

async function getPrisma() {
  if (!prisma) {
    const { prisma: PrismaClient } = await import('@/lib/prisma');
    prisma = PrismaClient;
  }
  return prisma;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Prisma 클라이언트 가져오기
    const db = await getPrisma();

    // 사용자 조회
    const user = await db.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true,
        staff: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // 비밀번호 제거 후 응답
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: '로그인에 성공했습니다.',
      user: userWithoutPassword,
      token
    });

    // 쿠키에 토큰 저장
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7일
    });

    return response;

  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
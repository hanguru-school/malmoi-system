import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { authenticateUser } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // 환경변수 확인
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 누락되었습니다.' },
        { status: 503 }
      );
    }

    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '인증 설정이 누락되었습니다.' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 인증
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증 (이미 authenticateUser에서 처리됨)
    if (!user) {
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
    
    // 더 구체적인 에러 메시지
    let errorMessage = '로그인 중 오류가 발생했습니다.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        errorMessage = '데이터베이스 연결 오류입니다.';
        statusCode = 503;
      } else if (error.message.includes('prisma')) {
        errorMessage = '데이터베이스 오류입니다.';
        statusCode = 503;
      } else if (error.message.includes('NEXTAUTH_SECRET')) {
        errorMessage = '인증 설정 오류입니다.';
        statusCode = 500;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { authenticateUser } from '@/lib/database';

// Node.js 런타임 명시
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('로그인 요청 시작');
    
    const { email, password } = await request.json();
    console.log('받은 데이터:', { email, password: password ? '***' : 'undefined' });

    // 입력 검증
    if (!email || !password) {
      console.log('입력 검증 실패:', { email: !!email, password: !!password });
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log('사용자 인증 시작');
    // 사용자 인증
    const user = await authenticateUser(email, password);
    console.log('인증 결과:', user ? '성공' : '실패');

    if (!user) {
      console.log('인증 실패');
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
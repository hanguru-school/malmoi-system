import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  console.log('=== 로그인 API 시작 ===');
  
  try {
    const body = await request.json();
    console.log('로그인 요청:', { email: body.email });

    const { email, password } = body;

    // 1. 입력 데이터 검증
    if (!email || !password) {
      console.log('필수 필드 누락');
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 2. 사용자 조회
    console.log('사용자 조회 중...');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        teacher: true,
        staff: true,
        admin: true
      }
    });

    if (!user) {
      console.log('사용자 없음');
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    console.log('사용자 발견:', { userId: user.id, role: user.role });

    // 3. 비밀번호 확인
    console.log('비밀번호 확인 중...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('비밀번호 불일치');
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    console.log('비밀번호 확인 성공');

    // 4. 세션 데이터 생성
    console.log('세션 데이터 생성 중...');
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken: 'temp-token', // 임시 토큰
      idToken: 'temp-id-token', // 임시 ID 토큰
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7일
    };

    // 5. 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // 6. 세션 쿠키 설정
    response.cookies.set('auth-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    });

    console.log('=== 로그인 완료 ===');
    return response;

  } catch (error) {
    console.error('=== 로그인 API 오류 ===');
    console.error('오류 타입:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
    console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace');

    let errorMessage = '로그인에 실패했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('prisma')) {
        errorMessage = '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('validation')) {
        errorMessage = '입력 정보가 올바르지 않습니다. 다시 확인해주세요.';
      } else {
        errorMessage = `로그인 실패: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
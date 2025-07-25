import { NextRequest, NextResponse } from 'next/server';
import { simpleAuthService } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: '모든 필수 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 간단한 인증 회원가입
    console.log('Simple auth 회원가입 시도:', { email, name, role });
    const authResult = await simpleAuthService.signUp(email, password, name, role);
    console.log('Simple auth 회원가입 결과:', authResult);

    if (!authResult.success) {
      console.error('Simple auth 회원가입 실패:', authResult.message);
      return NextResponse.json(
        { error: authResult.message },
        { status: 400 }
      );
    }

    // 응답 설정
    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      token: authResult.token,
      message: '회원가입에 성공했습니다.'
    });

    // 쿠키에 토큰 저장
    if (authResult.token) {
      response.cookies.set('auth-token', authResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24시간
      });
    }

    return response;

  } catch (error) {
    console.error('Simple auth 회원가입 오류:', error);
    
    // 더 자세한 오류 정보 반환
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `회원가입 오류: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
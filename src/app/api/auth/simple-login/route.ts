import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Simple login attempt:', { email, password });

    // 간단한 하드코딩된 인증 (테스트용)
    if (email === 'hanguru.school@gmail.com' && password === 'Alfl1204!') {
      const mockUser = {
        id: '1',
        email: 'hanguru.school@gmail.com',
        name: '관리자',
        role: 'admin'
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      console.log('Login successful:', mockUser);

      return NextResponse.json({
        success: true,
        user: mockUser,
        token: mockToken,
        message: '로그인에 성공했습니다.'
      });
    } else {
      console.log('Login failed: Invalid credentials');
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Simple login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
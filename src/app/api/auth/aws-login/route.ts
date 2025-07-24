import { NextRequest, NextResponse } from 'next/server';
import { cognitoService } from '@/lib/aws-cognito';
import { databaseService } from '@/lib/aws-rds';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // AWS Cognito 로그인
    const cognitoResult = await cognitoService.signIn(email, password);

    if (!cognitoResult.success) {
      return NextResponse.json(
        { error: cognitoResult.message },
        { status: 401 }
      );
    }

    // 데이터베이스에서 사용자 정보 조회
    const user = await databaseService.getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        cognitoUserId: user.cognito_user_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 응답 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token,
      message: '로그인에 성공했습니다.'
    });

    // 쿠키에 토큰 저장
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24시간
    });

    return response;

  } catch (error) {
    console.error('AWS 로그인 오류:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
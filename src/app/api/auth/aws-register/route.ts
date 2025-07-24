import { NextRequest, NextResponse } from 'next/server';
import { cognitoService } from '@/lib/aws-cognito';
import { databaseService } from '@/lib/aws-rds';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    // 입력 검증
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 기존 사용자 확인
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    // AWS Cognito 사용자 등록
    const cognitoResult = await cognitoService.signUp(email, password, name, role);

    if (!cognitoResult.success) {
      return NextResponse.json(
        { error: cognitoResult.message },
        { status: 400 }
      );
    }

    // 데이터베이스에 사용자 정보 저장
    const user = await databaseService.createUser({
      email,
      name,
      role,
      cognitoUserId: cognitoResult.userId!
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: '회원가입이 완료되었습니다.'
    });

  } catch (error) {
    console.error('AWS 회원가입 오류:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
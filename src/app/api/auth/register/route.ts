import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  console.log('=== 회원가입 API 시작 ===');
  
  try {
    const body = await request.json();
    console.log('회원가입 요청 데이터:', { 
      email: body.email, 
      name: body.name, 
      role: body.role 
    });

    const { email, password, name, phone, role = 'STUDENT' } = body;

    // 1. 입력 데이터 검증
    if (!email || !password || !name) {
      console.log('필수 필드 누락');
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('이메일 형식 오류');
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      console.log('비밀번호 길이 부족');
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 2. 기존 사용자 확인
    console.log('기존 사용자 확인 중...');
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      console.log('이미 존재하는 이메일');
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다.' },
        { status: 409 }
      );
    }

    // 3. 비밀번호 해싱
    console.log('비밀번호 해싱 중...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. 사용자 생성
    console.log('사용자 생성 중...');
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        phone: phone || null,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('사용자 생성 성공:', user.id);

    // 5. 역할별 프로필 생성
    if (role === 'STUDENT') {
      console.log('학생 프로필 생성 중...');
      await prisma.student.create({
        data: {
          userId: user.id,
          name: name,
          kanjiName: name,
          yomigana: name,
          koreanName: name,
          phone: phone || null,
          level: '초급 A',
          points: 0,
          joinDate: new Date()
        }
      });
      console.log('학생 프로필 생성 완료');
    } else if (role === 'TEACHER') {
      console.log('선생님 프로필 생성 중...');
      await prisma.teacher.create({
        data: {
          userId: user.id,
          name: name,
          kanjiName: name,
          yomigana: name,
          koreanName: name,
          phone: phone || null,
          subjects: ['일본어'],
          hourlyRate: 30000
        }
      });
      console.log('선생님 프로필 생성 완료');
    } else if (role === 'STAFF') {
      console.log('직원 프로필 생성 중...');
      await prisma.staff.create({
        data: {
          userId: user.id,
          name: name,
          kanjiName: name,
          yomigana: name,
          koreanName: name,
          phone: phone || null,
          position: '직원',
          permissions: {}
        }
      });
      console.log('직원 프로필 생성 완료');
    }

    console.log('=== 회원가입 완료 ===');
    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('=== 회원가입 API 오류 ===');
    console.error('오류 타입:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
    console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace');

    let errorMessage = '회원가입에 실패했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('prisma')) {
        errorMessage = '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('validation')) {
        errorMessage = '입력 정보가 올바르지 않습니다. 다시 확인해주세요.';
      } else {
        errorMessage = `회원가입 실패: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      kanjiName, 
      yomigana, 
      koreanName, 
      phone, 
      password, 
      role = 'STUDENT',
      studentEmail 
    } = await request.json();

    // 입력 검증
    if (!email || !kanjiName || !yomigana || !phone || !password) {
      return NextResponse.json(
        { error: '이메일, 한자이름, 요미가나, 연락처, 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 연락처 형식 검증
    const phoneRegex = /^[0-9-+\s()]+$/;
    if (!phoneRegex.test(phone) || phone.length < 10) {
      return NextResponse.json(
        { error: '올바른 연락처 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 강도 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // Prisma 클라이언트 사용
    const db = prisma;

    // 이메일 중복 확인
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      );
    }

    // 학부모인 경우 학생 이메일 검증
    if (role === 'PARENT') {
      if (!studentEmail) {
        return NextResponse.json(
          { error: '학부모 가입 시 학생 이메일이 필요합니다.' },
          { status: 400 }
        );
      }
      if (!emailRegex.test(studentEmail)) {
        return NextResponse.json(
          { error: '올바른 학생 이메일 형식이 아닙니다.' },
          { status: 400 }
        );
      }
      // 학생 계정 존재 확인
      const studentUser = await db.user.findUnique({
        where: { email: studentEmail },
        include: { student: true }
      });
      if (!studentUser || !studentUser.student) {
        return NextResponse.json(
          { error: '해당 이메일의 학생을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      // 이미 해당 학생과 연동된 학부모가 있는지 확인
      const existingParent = await db.user.findFirst({
        where: {
          role: 'PARENT',
          parent: {
            studentId: studentUser.student.id
          }
        }
      });
      if (existingParent) {
        return NextResponse.json(
          { error: '해당 학생은 이미 학부모와 연동되어 있습니다.' },
          { status: 409 }
        );
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 이름 조합 (한자 + 요미가나 + 한글)
    const fullName = `${kanjiName} (${yomigana})${koreanName ? ` / ${koreanName}` : ''}`;

    // 사용자 생성
    const user = await db.user.create({
      data: {
        email,
        name: fullName,
        password: hashedPassword,
        role,
        phone,
        ...(role === 'STUDENT' && {
          student: {
            create: {
              name: fullName,
              kanjiName,
              yomigana,
              koreanName: koreanName || '',
              level: '초급 A',
              points: 0
            }
          }
        }),
        ...(role === 'PARENT' && {
          parent: {
            create: {
              name: fullName,
              kanjiName,
              yomigana,
              koreanName: koreanName || '',
              studentId: null // 나중에 업데이트
            }
          }
        }),
        ...(role === 'TEACHER' && {
          teacher: {
            create: {
              name: fullName,
              kanjiName,
              yomigana,
              koreanName: koreanName || '',
              subjects: ['한국어'],
              hourlyRate: 30000
            }
          }
        }),
        ...(role === 'STAFF' && {
          staff: {
            create: {
              name: fullName,
              kanjiName,
              yomigana,
              koreanName: koreanName || '',
              position: '사무직원',
              permissions: {}
            }
          }
        }),
        ...(role === 'ADMIN' && {
          admin: {
            create: {
              name: fullName,
              kanjiName,
              yomigana,
              koreanName: koreanName || '',
              permissions: {},
              isApproved: false // 마스터 관리자 승인 필요
            }
          }
        })
      },
      include: {
        student: true,
        parent: true,
        teacher: true,
        staff: true,
        admin: true
      }
    });

    // 학부모인 경우 학생과 연동
    if (role === 'PARENT' && studentEmail) {
      const studentUser = await db.user.findUnique({
        where: { email: studentEmail },
        include: { student: true }
      });
      if (studentUser && studentUser.student) {
        await db.parent.update({
          where: { userId: user.id },
          data: { studentId: studentUser.student.id }
        });
      }
    }

    // 비밀번호 제거 후 응답
    const { password: _, ...userWithoutPassword } = user;

    // === 자동 로그인(세션 쿠키 발급) ===
    const response = NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: userWithoutPassword
    }, { status: 201 });

    // 세션 데이터 생성 (auth-utils와 일치)
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

    // auth-session 쿠키 설정 (auth-utils와 일치)
    response.cookies.set('auth-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
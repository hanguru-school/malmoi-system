import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      kanjiName, 
      yomigana, 
      koreanName, 
      phone, 
      role = 'STUDENT',
      studentEmail 
    } = await request.json();

    // 필수 필드 검증
    if (!email || !password || !kanjiName || !yomigana) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 한자 이름, 요미가나를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    // 학부모인 경우 학생 확인
    if (role === 'PARENT' && studentEmail) {
      const student = await prisma.user.findUnique({
        where: { email: studentEmail.toLowerCase() },
        include: { student: true }
      });

      if (!student || !student.student) {
        return NextResponse.json(
          { error: '해당 이메일의 학생을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password, // 실제 환경에서는 해시된 비밀번호 사용
        name: kanjiName, // 한자 이름을 기본 이름으로 사용
        phone,
        role: role as any
      }
    });

    // 역할에 따른 추가 데이터 생성
    if (role === 'STUDENT') {
      await prisma.student.create({
        data: {
          userId: user.id,
          name: kanjiName,
          kanjiName,
          yomigana,
          koreanName: koreanName || null,
          phone: phone || null,
          level: '초급 A',
          points: 0
        }
      });
    } else if (role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          name: kanjiName,
          kanjiName,
          yomigana,
          koreanName: koreanName || null,
          phone: phone || null,
          subjects: ['한국어'],
          hourlyRate: 30000
        }
      });
    } else if (role === 'STAFF') {
      await prisma.staff.create({
        data: {
          userId: user.id,
          name: kanjiName,
          kanjiName,
          yomigana,
          koreanName: koreanName || null,
          phone: phone || null,
          position: '사무직원'
        }
      });
    } else if (role === 'PARENT') {
      // 학부모인 경우 학생과 연결
      const student = await prisma.user.findUnique({
        where: { email: studentEmail.toLowerCase() },
        include: { student: true }
      });

      if (student && student.student) {
        await prisma.parent.create({
          data: {
            userId: user.id,
            name: kanjiName,
            kanjiName,
            yomigana,
            koreanName: koreanName || null,
            phone: phone || null,
            studentId: student.student.id
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
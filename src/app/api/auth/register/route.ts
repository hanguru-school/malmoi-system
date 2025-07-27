import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// 동적 import로 Prisma 로드
let prisma: any;

async function getPrisma() {
  if (!prisma) {
    const { prisma: PrismaClient } = await import('@/lib/prisma');
    prisma = PrismaClient;
  }
  return prisma;
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role = 'STUDENT' } = await request.json();

    // 입력 검증
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: '이메일, 이름, 비밀번호는 필수입니다.' },
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

    // 비밀번호 강도 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // Prisma 클라이언트 가져오기
    const db = await getPrisma();

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

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        ...(role === 'STUDENT' && {
          student: {
            create: {
              name,
              level: '초급 A',
              points: 0
            }
          }
        }),
        ...(role === 'TEACHER' && {
          teacher: {
            create: {
              name,
              subjects: ['한국어'],
              hourlyRate: 30000
            }
          }
        }),
        ...(role === 'STAFF' && {
          staff: {
            create: {
              name,
              position: '사무직원',
              permissions: {}
            }
          }
        })
      },
      include: {
        student: true,
        teacher: true,
        staff: true
      }
    });

    // 비밀번호 제거 후 응답
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
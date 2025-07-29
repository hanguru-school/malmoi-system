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
    console.log('=== 로그인 API 호출됨 ===');
    
    const { email, password } = await request.json();
    console.log('로그인 요청:', { email, password: password ? '***' : 'undefined' });

    if (!email || !password) {
      console.log('이메일 또는 비밀번호 누락');
      return NextResponse.json({ 
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.' 
      }, { status: 400 });
    }

    // Prisma 클라이언트 가져오기
    const db = await getPrisma();
    console.log('Prisma 클라이언트 로드 완료');

    // 사용자 조회
    const user = await db.user.findUnique({
      where: { email },
      include: {
        student: true,
        parent: true,
        teacher: true,
        staff: true,
        admin: true
      }
    });

    console.log('사용자 조회 결과:', user ? '사용자 발견' : '사용자 없음');

    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return NextResponse.json({ 
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
      }, { status: 401 });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('비밀번호 확인 결과:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('비밀번호 불일치');
      return NextResponse.json({ 
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
      }, { status: 401 });
    }

    // 관리자인 경우 승인 상태 확인
    if (user.role === 'ADMIN' && user.admin && !user.admin.isApproved) {
      console.log('승인되지 않은 관리자 계정');
      return NextResponse.json({ 
        success: false,
        message: '관리자 계정이 아직 승인되지 않았습니다. 마스터 관리자의 승인을 기다려주세요.' 
      }, { status: 403 });
    }

    console.log('로그인 성공, 사용자 역할:', user.role);

    // 사용자 정보에서 비밀번호 제거
    const { password: _, ...userWithoutPassword } = user;

    // 역할별 추가 정보 포함
    let userData: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt
    };

    // 역할별 특정 정보 추가
    switch (user.role) {
      case 'STUDENT':
        if (user.student) {
          userData = {
            ...userData,
            studentId: user.student.id,
            level: user.student.level,
            points: user.student.points,
            kanjiName: user.student.kanjiName,
            yomigana: user.student.yomigana,
            koreanName: user.student.koreanName
          };
        }
        break;
      case 'PARENT':
        if (user.parent) {
          userData = {
            ...userData,
            parentId: user.parent.id,
            studentId: user.parent.studentId,
            kanjiName: user.parent.kanjiName,
            yomigana: user.parent.yomigana,
            koreanName: user.parent.koreanName
          };
        }
        break;
      case 'TEACHER':
        if (user.teacher) {
          userData = {
            ...userData,
            teacherId: user.teacher.id,
            subjects: user.teacher.subjects,
            hourlyRate: user.teacher.hourlyRate,
            kanjiName: user.teacher.kanjiName,
            yomigana: user.teacher.yomigana,
            koreanName: user.teacher.koreanName
          };
        }
        break;
      case 'STAFF':
        if (user.staff) {
          userData = {
            ...userData,
            staffId: user.staff.id,
            position: user.staff.position,
            permissions: user.staff.permissions,
            kanjiName: user.staff.kanjiName,
            yomigana: user.staff.yomigana,
            koreanName: user.staff.koreanName
          };
        }
        break;
      case 'ADMIN':
        if (user.admin) {
          userData = {
            ...userData,
            adminId: user.admin.id,
            permissions: user.admin.permissions,
            isApproved: user.admin.isApproved,
            kanjiName: user.admin.kanjiName,
            yomigana: user.admin.yomigana,
            koreanName: user.admin.koreanName
          };
        }
        break;
    }

    console.log('반환할 사용자 데이터:', userData);

    // 세션 쿠키 설정
    const response = NextResponse.json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: userData
    });

    // 세션 쿠키 설정 (실제로는 JWT나 세션 관리 시스템 사용 권장)
    response.cookies.set('user-session', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    });

    console.log('로그인 API 응답 완료');
    return response;

  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json({ 
      success: false,
      message: '로그인 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 
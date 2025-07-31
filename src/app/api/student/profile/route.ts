import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 학생 프로필 조회 시작 ===');
    
    // 인증 확인
    const session = getSessionFromCookies(request);
    if (!session) {
      console.log('세션 없음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    console.log('사용자 정보:', { userId, userRole });

    // 학생 정보 확인
    if (userRole !== 'STUDENT') {
      console.log('학생이 아님:', userRole);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 학생 정보 조회
    const student = await prisma.student.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            name: true
          }
        }
      }
    });

    if (!student) {
      console.log('학생 정보 없음');
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log('학생 정보 조회 성공:', student.id);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name || student.user.name,
        kanjiName: student.kanjiName,
        yomigana: student.yomigana,
        koreanName: student.koreanName,
        phone: student.phone || student.user.phone,
        email: student.user.email,
        level: student.level,
        points: student.points,
        joinDate: student.joinDate,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });

  } catch (error) {
    console.error('학생 프로필 조회 오류:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('=== 학생 프로필 업데이트 시작 ===');
    
    // 인증 확인
    const session = getSessionFromCookies(request);
    if (!session) {
      console.log('세션 없음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    console.log('사용자 정보:', { userId, userRole });

    // 학생 정보 확인
    if (userRole !== 'STUDENT') {
      console.log('학생이 아님:', userRole);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('업데이트 데이터:', body);
    
    const {
      kanjiName,
      yomigana,
      koreanName,
      phone,
      email,
      avatar,
      birthDate,
      address
    } = body;

    // 학생 정보 업데이트
    const updatedStudent = await prisma.student.update({
      where: { userId: userId },
      data: {
        kanjiName: kanjiName || undefined,
        yomigana: yomigana || undefined,
        koreanName: koreanName || undefined,
        phone: phone || undefined,
        updatedAt: new Date()
      }
    });

    console.log('학생 정보 업데이트 성공:', updatedStudent.id);

    // 사용자 정보도 업데이트
    if (email) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: email,
          updatedAt: new Date()
        }
      });
      console.log('사용자 이메일 업데이트 성공');
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        kanjiName: updatedStudent.kanjiName,
        yomigana: updatedStudent.yomigana,
        koreanName: updatedStudent.koreanName,
        phone: updatedStudent.phone
      }
    });

  } catch (error) {
    console.error('학생 프로필 업데이트 오류:', error);
    return NextResponse.json(
      { error: 'Failed to update student profile' },
      { status: 500 }
    );
  }
} 
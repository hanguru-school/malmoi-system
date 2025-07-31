import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 세션 쿠키에서 사용자 정보 추출
    const session = request.cookies.get('auth-session');
    if (!session) {
      return NextResponse.json({ user: null });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch {
      return NextResponse.json({ user: null });
    }

    if (!sessionData?.user?.id) {
      return NextResponse.json({ user: null });
    }

    // 세션 만료 확인
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      return NextResponse.json({ user: null });
    }

    // DB에서 최신 사용자 정보 가져오기
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      include: {
        student: true,
        parent: true,
        teacher: true,
        staff: true,
        admin: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ user: null });
    }

    // 비밀번호 제거
    const { password: _, ...userWithoutPassword } = dbUser;

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('세션 조회 오류:', error);
    return NextResponse.json({ user: null });
  }
} 
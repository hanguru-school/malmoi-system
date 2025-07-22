import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // 인증 토큰 삭제
    cookieStore.delete('auth-token');
    
    // 사용자 정보 쿠키 삭제
    cookieStore.delete('user-info');

    return NextResponse.json({
      success: true,
      message: '로그아웃 성공'
    });

  } catch (error) {
    console.error('로그아웃 오류:', error);
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
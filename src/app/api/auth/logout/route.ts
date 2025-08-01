import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 쿠키 삭제
    const response = NextResponse.json({ success: true });
    
    // 세션 쿠키 삭제
    response.cookies.delete('user-session');
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
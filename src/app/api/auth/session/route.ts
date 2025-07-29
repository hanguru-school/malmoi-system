import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 세션 확인 API 호출됨 ===');
    
    // 쿠키에서 사용자 세션 정보 읽기
    const userSessionCookie = request.cookies.get('user-session');
    
    if (!userSessionCookie) {
      console.log('사용자 세션 쿠키가 없습니다.');
      return NextResponse.json({
        success: false,
        message: '로그인이 필요합니다.',
        data: {
          authenticated: false
        }
      }, { status: 401 });
    }

    try {
      const userData = JSON.parse(userSessionCookie.value);
      console.log('사용자 세션 데이터:', userData);
      
      return NextResponse.json({
        success: true,
        message: '세션 정보를 성공적으로 조회했습니다.',
        data: {
          authenticated: true,
          user: userData
        }
      });

    } catch (parseError) {
      console.error('세션 쿠키 파싱 오류:', parseError);
      return NextResponse.json({
        success: false,
        message: '세션 정보가 유효하지 않습니다.',
        data: {
          authenticated: false
        }
      }, { status: 401 });
    }

  } catch (error) {
    console.error('세션 조회 오류:', error);
    return NextResponse.json({
      success: false,
      message: '세션 조회 중 오류가 발생했습니다.',
      data: {
        authenticated: false
      }
    }, { status: 500 });
  }
} 
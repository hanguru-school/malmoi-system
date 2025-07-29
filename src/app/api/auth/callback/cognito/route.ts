import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/cognito-provider';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Cognito OAuth 콜백 처리 ===');
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      console.error('OAuth 오류:', error);
      return NextResponse.redirect(new URL('/auth/login?error=oauth_error', request.url));
    }

    if (!code) {
      console.error('인증 코드가 없습니다.');
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
    }

    console.log('인증 코드 받음:', code);
    console.log('상태:', state);

    try {
      // Authorization Code를 Access Token으로 교환
      const redirectUri = process.env.NEXT_PUBLIC_COGNITO_CALLBACK_URL || 'https://app.hanguru.school/api/auth/callback/cognito';
      const tokenResult = await exchangeCodeForToken(code, redirectUri);

      if (!tokenResult.success) {
        console.error('토큰 교환 실패:', tokenResult.error);
        return NextResponse.redirect(new URL('/auth/login?error=token_error', request.url));
      }

      console.log('토큰 교환 성공');
      const { accessToken, idToken } = tokenResult;

      // ID 토큰에서 사용자 정보 추출
      const tokenPayload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      console.log('토큰 페이로드:', tokenPayload);

      // 사용자 역할 결정 (기본값: STUDENT)
      const userRole = tokenPayload['custom:role'] || 'STUDENT';
      console.log('사용자 역할:', userRole);

      // 역할별 리다이렉트 URL 결정
      let redirectUrl = '/student/home';
      switch (userRole) {
        case 'STUDENT':
          redirectUrl = '/student/home';
          break;
        case 'PARENT':
          redirectUrl = '/parent/home';
          break;
        case 'TEACHER':
          redirectUrl = '/teacher/home';
          break;
        case 'STAFF':
          redirectUrl = '/staff/home';
          break;
        case 'ADMIN':
          redirectUrl = '/admin/dashboard';
          break;
        default:
          redirectUrl = '/student/home';
      }

      console.log('리다이렉트 URL:', redirectUrl);

      // 세션 쿠키 설정 (선택사항)
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      
      // 토큰을 쿠키에 저장 (보안을 위해 httpOnly 사용 권장)
      response.cookies.set('cognito-access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1시간
      });

      response.cookies.set('cognito-id-token', idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1시간
      });

      return response;

    } catch (tokenError: any) {
      console.error('토큰 교환 중 오류:', tokenError);
      return NextResponse.redirect(new URL('/auth/login?error=token_error', request.url));
    }

  } catch (error: any) {
    console.error('콜백 처리 중 오류:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
  }
} 
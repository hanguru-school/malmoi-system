import { NextRequest, NextResponse } from 'next/server';
import { handleCognitoCallback, createAuthSuccessResponse } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Cognito Callback API 호출됨 ===');
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('Callback Parameters:', {
      code: code ? '***' : null,
      state: state ? '***' : null,
      error,
      errorDescription
    });
    
    // 오류 확인
    if (error) {
      console.error('Cognito callback error:', { error, errorDescription });
      return NextResponse.redirect(new URL(`/auth/login?error=${error}&error_description=${errorDescription}`, request.url));
    }
    
    // Authorization code 확인
    if (!code) {
      console.error('No authorization code provided');
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
    }
    
    // Cognito 콜백 처리
    const result = await handleCognitoCallback(code, state || undefined);
    
    if ('code' in result) {
      // 오류 발생
      console.error('Cognito callback processing error:', result);
      return NextResponse.redirect(new URL(`/auth/login?error=${result.code}&error_description=${result.message}`, request.url));
    }
    
    // 성공 시 세션 설정
    console.log('Authentication successful for user:', result.user.email);
    
    const response = createAuthSuccessResponse(result);
    
    // 성공 페이지로 리다이렉트
    const redirectUrl = new URL('/auth/success', request.url);
    redirectUrl.searchParams.set('user', result.user.email);
    
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // 세션 쿠키 복사
    const sessionCookie = response.cookies.get('auth-session');
    if (sessionCookie) {
      redirectResponse.cookies.set('auth-session', sessionCookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });
    }
    
    // 보안 헤더 설정
    redirectResponse.headers.set('X-Frame-Options', 'DENY');
    redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
    redirectResponse.headers.set('X-XSS-Protection', '1; mode=block');
    redirectResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return redirectResponse;
    
  } catch (error: any) {
    console.error('Cognito callback API 오류:', error);
    return NextResponse.redirect(new URL(`/auth/login?error=callback_error&error_description=${encodeURIComponent(error.message)}`, request.url));
  }
} 
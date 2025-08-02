// Cognito-based Authentication Utilities for MalMoi System

import { NextRequest, NextResponse } from 'next/server';
import { createOAuthUrl, exchangeCodeForToken, parseIdToken } from './cognito-provider';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  idToken: string;
  expiresAt: number;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * 인증 세션 생성
 */
export function createAuthSession(userData: any, tokens: any): AuthSession {
  return {
    user: {
      id: userData.sub,
      email: userData.email,
      name: userData.name || userData.email,
      role: userData.role || 'STUDENT'
    },
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    expiresAt: Date.now() + (tokens.expiresIn * 1000)
  };
}

/**
 * 쿠키에서 세션 정보 가져오기
 */
export function getSessionFromCookies(request: NextRequest): AuthSession | null {
  try {
    const sessionCookie = request.cookies.get('auth-session')?.value;
    if (!sessionCookie) return null;

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    
    // 세션 만료 확인
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Session parsing error:', error);
    return null;
  }
}

/**
 * 세션을 쿠키에 저장
 */
export function setSessionCookie(response: NextResponse, session: AuthSession): void {
  const sessionData = encodeURIComponent(JSON.stringify(session));
  
  response.cookies.set('auth-session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
}

/**
 * 세션 쿠키 삭제
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete('auth-session');
}

/**
 * 인증 상태 확인
 */
export function isAuthenticated(request: NextRequest): boolean {
  const session = getSessionFromCookies(request);
  return session !== null;
}

/**
 * 사용자 역할 확인
 */
export function hasRole(request: NextRequest, requiredRole: string): boolean {
  const session = getSessionFromCookies(request);
  if (!session) return false;
  
  return session.user.role === requiredRole;
}

/**
 * 인증 미들웨어
 */
export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    if (!isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    return handler(request);
  };
}

/**
 * 역할 기반 인증 미들웨어
 */
export function requireRole(requiredRole: string) {
  return function(handler: Function) {
    return async (request: NextRequest) => {
      if (!isAuthenticated(request)) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      
      if (!hasRole(request, requiredRole)) {
        return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
      }
      
      return handler(request);
    };
  };
}

/**
 * Cognito OAuth 로그인 URL 생성
 */
export function createLoginUrl(state?: string): string {
  return createOAuthUrl(state);
}

/**
 * Cognito 콜백 처리
 */
export async function handleCognitoCallback(code: string, state?: string): Promise<AuthSession | AuthError> {
  try {
    // Authorization code를 토큰으로 교환
    const tokenResult = await exchangeCodeForToken(code, state);
    
    if (!tokenResult.success) {
      return {
        code: 'TOKEN_EXCHANGE_FAILED',
        message: tokenResult.error || '토큰 교환에 실패했습니다.',
        details: tokenResult
      };
    }

    // ID Token에서 사용자 정보 추출
    const userData = parseIdToken(tokenResult.idToken!);
    
    // 세션 생성
    const session = createAuthSession(userData, tokenResult);
    
    return session;
  } catch (error: any) {
    console.error('Cognito callback error:', error);
    return {
      code: 'CALLBACK_ERROR',
      message: '인증 콜백 처리 중 오류가 발생했습니다.',
      details: error.message
    };
  }
}

/**
 * 로그아웃 처리
 */
export function createLogoutUrl(redirectUri?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  
  const logoutUrl = new URL(`${baseUrl}/logout`);
  logoutUrl.searchParams.set('client_id', clientId!);
  
  if (redirectUri) {
    logoutUrl.searchParams.set('logout_uri', redirectUri);
  }
  
  return logoutUrl.toString();
}

/**
 * CSRF 토큰 생성
 */
export function generateCSRFToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF 토큰 검증
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

/**
 * 보안 헤더 설정
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
  
  return response;
}

/**
 * 인증 오류 응답 생성
 */
export function createAuthErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json({
    success: false,
    error: error.code,
    message: error.message,
    details: error.details
  }, { status: 401 });
}

/**
 * 인증 성공 응답 생성
 */
export function createAuthSuccessResponse(session: AuthSession): NextResponse {
  const response = NextResponse.json({
    success: true,
    user: session.user
  });
  
  setSessionCookie(response, session);
  return setSecurityHeaders(response);
} 
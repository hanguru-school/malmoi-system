import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createSuccessResponse } from '@/lib/api-utils';
import jwt from 'jsonwebtoken';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 환경변수 검증
    if (!process.env.AWS_REGION || !process.env.COGNITO_CLIENT_ID || !process.env.JWT_SECRET) {
      console.error('Missing required environment variables for login');
      return NextResponse.json({
        success: false,
        message: '서버 설정이 완료되지 않았습니다.',
        error: 'MISSING_ENV_VARS',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: '이메일과 비밀번호를 입력하세요.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log('Login attempt for:', email);

    // AWS Cognito 클라이언트 초기화
    const cognitoClient = new CognitoIdentityProviderClient({ 
      region: process.env.AWS_REGION 
    });

    // AWS Cognito 로그인 시도
    const authResult = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: { 
          USERNAME: email, 
          PASSWORD: password 
        },
      })
    );

    console.log('Cognito authentication successful for:', email);

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        email, 
        sub: authResult.AuthenticationResult?.AccessToken || email,
        iat: Math.floor(Date.now() / 1000)
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    return createSuccessResponse({
      token,
      user: { email },
      authResult: {
        accessToken: authResult.AuthenticationResult?.AccessToken,
        refreshToken: authResult.AuthenticationResult?.RefreshToken,
        expiresIn: authResult.AuthenticationResult?.ExpiresIn
      }
    }, '로그인이 성공했습니다.');

  } catch (error) {
    console.error('Login error:', error);
    
    // Cognito 특정 에러 처리
    if (error instanceof Error) {
      if (error.message.includes('NotAuthorizedException')) {
        return NextResponse.json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.',
          error: 'INVALID_CREDENTIALS',
          timestamp: new Date().toISOString()
        }, { status: 401 });
      }
      
      if (error.message.includes('UserNotFoundException')) {
        return NextResponse.json({
          success: false,
          message: '등록되지 않은 사용자입니다.',
          error: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      
      if (error.message.includes('UserNotConfirmedException')) {
        return NextResponse.json({
          success: false,
          message: '이메일 인증이 완료되지 않았습니다.',
          error: 'USER_NOT_CONFIRMED',
          timestamp: new Date().toISOString()
        }, { status: 403 });
      }
    }

    return handleApiError(error, 'POST /api/auth/login');
  }
} 
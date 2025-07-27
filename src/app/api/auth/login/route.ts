import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateEnvironmentVariables,
  checkDatabaseConnection
} from '@/lib/api-utils';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called');
    
    // 환경변수 검증
    const envCheck = validateEnvironmentVariables();
    if (!envCheck.isValid) {
      console.error('Environment variables missing:', envCheck.missingVars);
      return createErrorResponse(
        '서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.',
        500,
        `MISSING_ENV_VARS: ${envCheck.missingVars.join(', ')}`
      );
    }

    // 데이터베이스 연결 확인
    const dbCheck = await checkDatabaseConnection();
    if (!dbCheck.success) {
      console.error('Database connection failed:', dbCheck.error);
      return createErrorResponse(
        '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
        500,
        dbCheck.error
      );
    }

    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return createErrorResponse(
        '잘못된 요청 형식입니다.',
        400,
        'INVALID_REQUEST_FORMAT'
      );
    }

    const { email, password } = body;

    // 입력 검증
    if (!email || !password) {
      return createErrorResponse(
        '이메일과 비밀번호를 모두 입력해주세요.',
        400,
        'MISSING_CREDENTIALS'
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        '올바른 이메일 형식을 입력해주세요.',
        400,
        'INVALID_EMAIL_FORMAT'
      );
    }

    // 데이터베이스 인증 로직
    try {
      const { authenticateUser } = await import('@/lib/database');
      const user = await authenticateUser(email, password);

      if (!user) {
        console.warn('Login failed for email:', email);
        return createErrorResponse(
          '이메일 또는 비밀번호가 올바르지 않습니다.',
          401,
          'INVALID_CREDENTIALS'
        );
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: '24h' }
      );

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      console.log('Login successful for user:', user.email);
      return createSuccessResponse(
        { user: userData, token },
        '로그인이 성공했습니다.'
      );

    } catch (authError: any) {
      console.error('Authentication error:', authError);
      return createErrorResponse(
        '인증 처리 중 오류가 발생했습니다.',
        500,
        authError.message || 'AUTHENTICATION_ERROR'
      );
    }

  } catch (error: any) {
    console.error('Login API error:', error);
    return createErrorResponse(
      '로그인 처리 중 오류가 발생했습니다.',
      500,
      error.message || 'LOGIN_ERROR'
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Login GET API called');
    
    // 환경변수 검증
    const envCheck = validateEnvironmentVariables();
    if (!envCheck.isValid) {
      return createErrorResponse(
        '서버 설정 오류가 발생했습니다.',
        500,
        `MISSING_ENV_VARS: ${envCheck.missingVars.join(', ')}`
      );
    }

    const endpointInfo = {
      message: '로그인 엔드포인트가 사용 가능합니다.',
      method: 'POST',
      requiredFields: ['email', 'password'],
      timestamp: new Date().toISOString()
    };

    return createSuccessResponse(endpointInfo, '로그인 엔드포인트 정보');

  } catch (error: any) {
    console.error('Login GET API error:', error);
    return createErrorResponse(
      '엔드포인트 정보를 가져오는 중 오류가 발생했습니다.',
      500,
      error.message || 'LOGIN_GET_ERROR'
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { 
  handleApiError, 
  validateEnvironmentVariables 
} from '@/lib/api-utils';

// Node.js 런타임 명시
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 환경변수 검증
    const envCheck = validateEnvironmentVariables();
    if (!envCheck.isValid) {
      console.error('환경변수 누락:', envCheck.missingVars);
      return handleApiError(
        new Error(`Configuration error: Missing ${envCheck.missingVars.join(', ')}`),
        500
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // 입력 검증
    if (!email || !password) {
      return handleApiError(new Error('Email and password are required'), 400);
    }

    // 데이터베이스 인증 로직
    const { authenticateUser } = await import('@/lib/database');
    const user = await authenticateUser(email, password);

    if (!user) {
      return handleApiError(new Error('Invalid credentials'), 401);
    }

    // JWT 토큰 생성
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    return handleApiError(error, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 환경변수 검증
    const envCheck = validateEnvironmentVariables();
    if (!envCheck.isValid) {
      return handleApiError(
        new Error(`Configuration error: Missing ${envCheck.missingVars.join(', ')}`),
        500
      );
    }

    return NextResponse.json({
      message: 'Login endpoint is available',
      method: 'POST',
      requiredFields: ['email', 'password'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return handleApiError(error, 500);
  }
} 
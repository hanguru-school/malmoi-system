import { NextRequest } from 'next/server';
import { 
  withErrorHandling, 
  createAuthErrorResponse,
  validateEnvironmentVariables 
} from '@/lib/api-utils';

// Node.js 런타임 명시
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withErrorHandling(
    async () => {
      // 환경변수 검증
      const envCheck = validateEnvironmentVariables();
      if (!envCheck.isValid) {
        console.error('환경변수 누락:', envCheck.missingVars);
        return createAuthErrorResponse(
          `Configuration error: Missing ${envCheck.missingVars.join(', ')}`,
          500
        );
      }

      try {
        const body = await request.json();
        const { email, password } = body;

        // 입력 검증
        if (!email || !password) {
          return createAuthErrorResponse('Email and password are required', 400);
        }

        // 데이터베이스 인증 로직
        const { authenticateUser } = await import('@/lib/database');
        const user = await authenticateUser(email, password);

        if (!user) {
          return createAuthErrorResponse('Invalid credentials', 401);
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

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token,
          message: 'Login successful'
        };
      } catch (error) {
        console.error('Login error:', error);
        
        // 데이터베이스 연결 오류 체크
        if (error instanceof Error) {
          if (error.message.includes('ECONNREFUSED') || 
              error.message.includes('ENOTFOUND')) {
            return createAuthErrorResponse('Database connection failed', 503);
          }
        }
        
        return createAuthErrorResponse('Authentication failed', 500);
      }
    },
    'Login request failed'
  );
}

export async function GET(request: NextRequest) {
  return withErrorHandling(
    async () => {
      // 환경변수 검증
      const envCheck = validateEnvironmentVariables();
      if (!envCheck.isValid) {
        return createAuthErrorResponse(
          `Configuration error: Missing ${envCheck.missingVars.join(', ')}`,
          500
        );
      }

      return {
        message: 'Login endpoint is available',
        method: 'POST',
        requiredFields: ['email', 'password'],
        timestamp: new Date().toISOString()
      };
    },
    'Login GET request failed'
  );
} 
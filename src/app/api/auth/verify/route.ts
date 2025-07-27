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
        const { token } = body;

        if (!token) {
          return createAuthErrorResponse('Token is required', 400);
        }

        // JWT 토큰 검증
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

        // 사용자 정보 가져오기
        const { getUserById } = await import('@/lib/database');
        const user = await getUserById(decoded.userId);

        if (!user) {
          return createAuthErrorResponse('User not found', 404);
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token: decoded,
          message: 'Token verification successful'
        };
      } catch (error) {
        console.error('Token verification error:', error);
        
        if (error instanceof Error) {
          if (error.name === 'JsonWebTokenError') {
            return createAuthErrorResponse('Invalid token', 401);
          }
          if (error.name === 'TokenExpiredError') {
            return createAuthErrorResponse('Token expired', 401);
          }
        }
        
        return createAuthErrorResponse('Token verification failed', 500);
      }
    },
    'Token verification failed'
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
        message: 'Token verification endpoint is available',
        method: 'POST',
        requiredFields: ['token'],
        timestamp: new Date().toISOString()
      };
    },
    'Token verification GET failed'
  );
} 
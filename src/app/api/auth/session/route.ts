import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { 
  withErrorHandling, 
  createAuthErrorResponse,
  validateEnvironmentVariables 
} from '@/lib/api-utils';

// Node.js 런타임 명시
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
        // authOptions 동적 로드
        const { authOptions } = await import('@/lib/auth');
        
        // 세션 가져오기
        const session = await getServerSession(authOptions);
        
        if (!session) {
          return createAuthErrorResponse('No active session found', 401);
        }

        return {
          session,
          authenticated: true,
          user: session.user
        };
      } catch (error) {
        console.error('Session retrieval error:', error);
        return createAuthErrorResponse('Session retrieval failed', 500);
      }
    },
    'Session API request failed'
  );
}

export async function POST(request: NextRequest) {
  return withErrorHandling(
    async () => {
      const body = await request.json();
      
      // 환경변수 검증
      const envCheck = validateEnvironmentVariables();
      if (!envCheck.isValid) {
        return createAuthErrorResponse(
          `Configuration error: Missing ${envCheck.missingVars.join(', ')}`,
          500
        );
      }

      try {
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        
        return {
          session,
          authenticated: !!session,
          requestBody: body
        };
      } catch (error) {
        console.error('Session POST error:', error);
        return createAuthErrorResponse('Session operation failed', 500);
      }
    },
    'Session POST request failed'
  );
} 
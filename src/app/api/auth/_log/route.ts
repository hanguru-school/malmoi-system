import { NextRequest } from 'next/server';
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

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');
      const userId = searchParams.get('userId');

      return {
        action: action || 'unknown',
        userId: userId || 'unknown',
        timestamp: new Date().toISOString(),
        message: 'Authentication log endpoint accessed'
      };
    },
    'Auth log GET request failed'
  );
}

export async function POST(request: NextRequest) {
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

      try {
        const body = await request.json();
        
        // 로그 데이터 검증
        const { action, userId, details } = body;
        
        if (!action) {
          return createAuthErrorResponse('Missing required field: action', 400);
        }

        // 로그 저장 로직 (실제 구현에서는 데이터베이스에 저장)
        console.log('Auth log entry:', {
          action,
          userId: userId || 'unknown',
          details,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          logged: true,
          action,
          userId: userId || 'unknown',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Auth log POST error:', error);
        return createAuthErrorResponse('Failed to process auth log', 500);
      }
    },
    'Auth log POST request failed'
  );
} 
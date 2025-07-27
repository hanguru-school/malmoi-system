import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { 
  handleApiError, 
  validateEnvironmentVariables 
} from '@/lib/api-utils';

// Node.js 런타임 명시
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // authOptions 동적 로드
    const { authOptions } = await import('@/lib/auth');
    
    // 세션 가져오기
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return handleApiError(new Error('No active session found'), 401);
    }

    return NextResponse.json({
      session,
      authenticated: true,
      user: session.user
    });
  } catch (error) {
    return handleApiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 환경변수 검증
    const envCheck = validateEnvironmentVariables();
    if (!envCheck.isValid) {
      return handleApiError(
        new Error(`Configuration error: Missing ${envCheck.missingVars.join(', ')}`),
        500
      );
    }

    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session,
      authenticated: !!session,
      requestBody: body
    });
  } catch (error) {
    return handleApiError(error, 500);
  }
} 
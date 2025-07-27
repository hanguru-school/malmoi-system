import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  withErrorHandling 
} from '@/lib/api-utils';

// Node.js 런타임 명시
export const runtime = 'nodejs';

// 동적 import로 authOptions 로드
async function getAuthOptions() {
  try {
    // 환경변수 검증
    const envCheck = validateEnvironmentVariables();
    if (!envCheck.isValid) {
      console.error('환경변수 누락:', envCheck.missingVars);
      throw new Error(`Missing environment variables: ${envCheck.missingVars.join(', ')}`);
    }

    const { authOptions } = await import('@/lib/auth');
    return authOptions;
  } catch (error) {
    console.error('AuthOptions 로드 오류:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  return withErrorHandling(
    async () => {
      const authOptions = await getAuthOptions();
      const response = await NextAuth(authOptions)(request);
      
      // NextAuth 응답이 이미 NextResponse인 경우 그대로 반환
      if (response instanceof NextResponse) {
        return response;
      }
      
      // 일반 응답인 경우 JSON으로 변환
      return NextResponse.json(response);
    },
    'NextAuth GET request failed'
  );
}

export async function POST(request: Request) {
  return withErrorHandling(
    async () => {
      const authOptions = await getAuthOptions();
      const response = await NextAuth(authOptions)(request);
      
      // NextAuth 응답이 이미 NextResponse인 경우 그대로 반환
      if (response instanceof NextResponse) {
        return response;
      }
      
      // 일반 응답인 경우 JSON으로 변환
      return NextResponse.json(response);
    },
    'NextAuth POST request failed'
  );
} 
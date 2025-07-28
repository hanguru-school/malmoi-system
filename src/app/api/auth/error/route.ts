import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({
      success: false,
      message: '로그인 중 오류가 발생했습니다. 이메일과 비밀번호를 확인하세요.',
      error: 'AUTH_ERROR',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth error API error:', error);
    return handleApiError(error, 'GET /api/auth/error');
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-utils';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (선택사항 - 비로그인 사용자도 문의 가능)
    const session = getSessionFromCookies(request);
    
    const formData: ContactFormData = await request.json();
    
    // 필수 필드 검증
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 문의 내용 저장 (실제로는 데이터베이스에 저장하거나 이메일로 전송)
    const contactData = {
      ...formData,
      userId: session?.user?.id || null,
      userRole: session?.user?.role || 'GUEST',
      submittedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    // 로그 출력 (실제 구현에서는 데이터베이스 저장 또는 이메일 전송)
    console.log('문의 제출:', contactData);

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '문의가 성공적으로 제출되었습니다.',
      contactId: `contact_${Date.now()}`
    });

  } catch (error) {
    console.error('문의 제출 오류:', error);
    return NextResponse.json(
      { error: '문의 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
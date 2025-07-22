import { NextRequest, NextResponse } from 'next/server';

// 임시 설정 데이터 (실제로는 데이터베이스에서 관리)
let currentSettings = {
  checkoutThreshold: 30,
  maxReTags: 3
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      settings: currentSettings
    });
  } catch (error) {
    console.error('Error fetching tagging settings:', error);
    return NextResponse.json(
      { success: false, error: '설정 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkoutThreshold, maxReTags } = body;
    
    // 유효성 검사
    if (typeof checkoutThreshold !== 'number' || checkoutThreshold < 1 || checkoutThreshold > 60) {
      return NextResponse.json(
        { success: false, error: '출퇴근 분기 기준은 1-60분 사이여야 합니다' },
        { status: 400 }
      );
    }
    
    if (typeof maxReTags !== 'number' || maxReTags < 1 || maxReTags > 10) {
      return NextResponse.json(
        { success: false, error: '최대 연속 태깅 횟수는 1-10회 사이여야 합니다' },
        { status: 400 }
      );
    }
    
    // 설정 업데이트
    currentSettings = {
      checkoutThreshold,
      maxReTags
    };
    
    return NextResponse.json({
      success: true,
      message: '설정이 성공적으로 업데이트되었습니다',
      settings: currentSettings
    });
    
  } catch (error) {
    console.error('Error updating tagging settings:', error);
    return NextResponse.json(
      { success: false, error: '설정 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
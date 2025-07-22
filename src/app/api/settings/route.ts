import { NextRequest, NextResponse } from 'next/server';
import { settingsManager } from '@/lib/settings';

// 시스템 설정 조회
export async function GET() {
  try {
    const settings = settingsManager.getSettings();
    
    return NextResponse.json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error('시스템 설정 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '시스템 설정 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 시스템 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { device, language, time, notifications, performance, userPreferences } = body;

    // 설정 업데이트
    settingsManager.updateSettings({
      device,
      language,
      time,
      notifications,
      performance,
      userPreferences
    });

    return NextResponse.json({
      success: true,
      message: '시스템 설정이 업데이트되었습니다'
    });
    
  } catch (error) {
    console.error('시스템 설정 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '시스템 설정 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 자동 최적화 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'auto_optimize':
        settingsManager.autoOptimize();
        break;
      case 'reset_settings':
        settingsManager.resetSettings();
        break;
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: '작업이 완료되었습니다'
    });
    
  } catch (error) {
    console.error('시스템 설정 작업 실패:', error);
    return NextResponse.json(
      { success: false, error: '시스템 설정 작업 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
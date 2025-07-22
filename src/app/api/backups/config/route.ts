import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';

// 백업 설정 조회
export async function GET() {
  try {
    const config = backupManager.getConfig();
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('백업 설정 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '백업 설정 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 백업 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { basePath, maxRollingBackups, maxProtectedBackups } = body;

    // 유효성 검사
    if (maxRollingBackups && (maxRollingBackups < 1 || maxRollingBackups > 100)) {
      return NextResponse.json(
        { success: false, error: 'Rolling 백업 최대 개수는 1-100 사이여야 합니다' },
        { status: 400 }
      );
    }

    if (maxProtectedBackups && (maxProtectedBackups < 1 || maxProtectedBackups > 50)) {
      return NextResponse.json(
        { success: false, error: 'Protected 백업 최대 개수는 1-50 사이여야 합니다' },
        { status: 400 }
      );
    }

    // 설정 업데이트
    await backupManager.updateConfig({
      basePath,
      maxRollingBackups,
      maxProtectedBackups
    });

    return NextResponse.json({
      success: true,
      message: '백업 설정이 업데이트되었습니다'
    });
    
  } catch (error) {
    console.error('백업 설정 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '백업 설정 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
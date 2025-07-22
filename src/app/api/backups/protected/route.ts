import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';

// 보호 목록 조회
export async function GET() {
  try {
    const stats = await backupManager.getBackupStats();
    
    return NextResponse.json({
      success: true,
      data: {
        protectedList: stats.protectedList,
        protectedCount: stats.protectedCount,
        maxProtectedBackups: 5
      }
    });
    
  } catch (error) {
    console.error('보호 목록 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '보호 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 보호 목록에 추가
export async function POST(request: NextRequest) {
  try {
    const { version } = await request.json();
    
    if (!version) {
      return NextResponse.json(
        { success: false, error: '버전 정보가 필요합니다' },
        { status: 400 }
      );
    }

    // 버전 형식 검증
    const versionRegex = /^v\d+\.\d+\.\d+$/;
    if (!versionRegex.test(version)) {
      return NextResponse.json(
        { success: false, error: '올바른 버전 형식이 아닙니다 (예: v1.0.0)' },
        { status: 400 }
      );
    }

    await backupManager.addToProtectedList(version);
    
    return NextResponse.json({
      success: true,
      message: '보호 목록에 추가되었습니다',
      data: {
        version,
        addedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('보호 목록 추가 실패:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '보호 목록 추가 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 보호 목록에서 제거
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    
    if (!version) {
      return NextResponse.json(
        { success: false, error: '버전 정보가 필요합니다' },
        { status: 400 }
      );
    }

    await backupManager.removeFromProtectedList(version);
    
    return NextResponse.json({
      success: true,
      message: '보호 목록에서 제거되었습니다',
      data: {
        version,
        removedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('보호 목록 제거 실패:', error);
    return NextResponse.json(
      { success: false, error: '보호 목록 제거 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
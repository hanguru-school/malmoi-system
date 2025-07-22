import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';

// 백업 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // history, rolling, protected, all
    
    const backups = await backupManager.listBackups();
    const stats = await backupManager.getBackupStats();
    
    let result;
    switch (type) {
      case 'history':
        result = backups.history;
        break;
      case 'rolling':
        result = backups.rolling;
        break;
      case 'protected':
        result = backups.protected;
        break;
      default:
        result = {
          history: backups.history,
          rolling: backups.rolling,
          protected: backups.protected,
          stats
        };
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('백업 목록 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '백업 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 백업 생성
export async function POST(request: NextRequest) {
  try {
    const { version } = await request.json();
    
    if (!version) {
      return NextResponse.json(
        { success: false, error: '버전 정보가 필요합니다' },
        { status: 400 }
      );
    }

    // 버전 형식 검증 (v1.0.0 형식)
    const versionRegex = /^v\d+\.\d+\.\d+$/;
    if (!versionRegex.test(version)) {
      return NextResponse.json(
        { success: false, error: '올바른 버전 형식이 아닙니다 (예: v1.0.0)' },
        { status: 400 }
      );
    }

    const createdBackups = await backupManager.createBackup(version);
    
    return NextResponse.json({
      success: true,
      message: '백업이 성공적으로 생성되었습니다',
      data: {
        version,
        backups: createdBackups,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('백업 생성 실패:', error);
    return NextResponse.json(
      { success: false, error: '백업 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export async function POST(request: NextRequest) {
  try {
    const { version, type } = await request.json();
    
    if (!version || !type) {
      return NextResponse.json(
        { success: false, error: '버전과 타입 정보가 필요합니다' },
        { status: 400 }
      );
    }

    // 백업 파일 경로 확인
    const backupPath = await backupManager.getBackupPath(version, type);
    
    if (!backupPath || !fs.existsSync(backupPath)) {
      return NextResponse.json(
        { success: false, error: '백업 파일을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // ZIP 파일 생성
    const archive = archiver('zip', {
      zlib: { level: 9 } // 최대 압축
    });

    // 백업 폴더를 ZIP에 추가
    archive.directory(backupPath, false);

    // 응답 헤더 설정
    const response = new NextResponse(archive as unknown as ReadableStream);
    response.headers.set('Content-Type', 'application/zip');
    response.headers.set('Content-Disposition', `attachment; filename="malmoi-backup-${version}-${type}.zip"`);

    // 압축 완료 후 응답
    archive.finalize();

    return response;

  } catch (error) {
    console.error('백업 다운로드 실패:', error);
    return NextResponse.json(
      { success: false, error: '백업 다운로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 백업 정보 조회 (다운로드 전 확인용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    const type = searchParams.get('type');

    if (!version || !type) {
      return NextResponse.json(
        { success: false, error: '버전과 타입 정보가 필요합니다' },
        { status: 400 }
      );
    }

    const backupInfo = await backupManager.getBackupInfo(version, type);
    
    if (!backupInfo) {
      return NextResponse.json(
        { success: false, error: '백업 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: backupInfo
    });

  } catch (error) {
    console.error('백업 정보 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '백업 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
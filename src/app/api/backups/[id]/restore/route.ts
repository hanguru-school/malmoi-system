import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { type = 'rolling' } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '백업 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 타입 검증
    if (!['history', 'rolling', 'protected'].includes(type)) {
      return NextResponse.json(
        { success: false, error: '잘못된 백업 타입입니다' },
        { status: 400 }
      );
    }

    await backupManager.restoreBackup(id, type as 'history' | 'rolling' | 'protected');
    
    return NextResponse.json({
      success: true,
      message: `백업 복원이 완료되었습니다: ${id} (${type})`,
      data: {
        version: id,
        type,
        restoredAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('백업 복원 실패:', error);
    return NextResponse.json(
      { success: false, error: '백업 복원 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
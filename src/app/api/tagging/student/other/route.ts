import { NextRequest, NextResponse } from 'next/server';

interface OtherTagging {
  uid: string;
  type: 'consultation' | 'materials' | 'other';
  notes?: string;
  timestamp: string;
}

// 기타 태깅 이력 저장 (실제로는 데이터베이스에 저장)
const otherTaggingHistory: Array<{
  uid: string;
  date: string;
  type: string;
  notes?: string;
  timestamp: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const { uid, type, notes, timestamp } = await request.json() as OtherTagging;
    
    if (!uid || !type) {
      return NextResponse.json(
        { success: false, error: 'UID와 타입이 필요합니다' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 기타 태깅 이력 기록
    const otherTagging = {
      uid,
      date: today,
      type,
      notes: notes || getDefaultNotes(type),
      timestamp
    };
    
    otherTaggingHistory.push(otherTagging);

    // 타입별 메시지 생성
    const typeMessages = {
      consultation: '상담이 기록되었습니다',
      materials: '교재 구매가 기록되었습니다',
      other: '기타 사항이 기록되었습니다'
    };

    return NextResponse.json({
      success: true,
      eventType: 'other',
      message: typeMessages[type],
      tagging: otherTagging
    });

  } catch (error) {
    console.error('Error processing other tagging:', error);
    return NextResponse.json(
      { success: false, error: '기타 태깅 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

function getDefaultNotes(type: string): string {
  switch (type) {
    case 'consultation':
      return '상담 요청';
    case 'materials':
      return '교재 구매';
    case 'other':
      return '기타 사항';
    default:
      return '기타 태깅';
  }
} 
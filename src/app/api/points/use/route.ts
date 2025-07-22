import { NextRequest, NextResponse } from 'next/server';

interface PointUsage {
  studentId: string;
  amount: number;
  reason: string;
  itemName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, amount, reason, itemName } = await request.json() as PointUsage;
    
    if (!studentId || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 데이터베이스에서 학생 정보 조회
    const mockStudent = {
      id: studentId,
      name: '김학생',
      points: 150
    };

    // 포인트 잔액 확인
    if (mockStudent.points < amount) {
      return NextResponse.json(
        { success: false, error: '포인트가 부족합니다' },
        { status: 400 }
      );
    }

    // 포인트 차감
    mockStudent.points -= amount;

    // 사용 내역 기록
    const usageRecord = {
      id: `usage_${Date.now()}`,
      studentId,
      type: 'use',
      amount,
      reason,
      itemName,
      timestamp: new Date().toISOString()
    };

    // 실제로는 데이터베이스에 저장
    console.log('Point usage recorded:', usageRecord);

    return NextResponse.json({
      success: true,
      student: {
        id: mockStudent.id,
        name: mockStudent.name,
        points: mockStudent.points
      },
      usage: usageRecord,
      message: `${amount}포인트가 사용되었습니다`
    });

  } catch (error) {
    console.error('Error processing point usage:', error);
    return NextResponse.json(
      { success: false, error: '포인트 사용 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
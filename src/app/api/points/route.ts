import { NextRequest, NextResponse } from 'next/server';

interface PointTransaction {
  id: string;
  studentId: string;
  type: 'earn' | 'use';
  amount: number;
  reason: string;
  timestamp: string;
}

interface StudentPoints {
  id: string;
  name: string;
  points: number;
  transactions: PointTransaction[];
}

// 임시 데이터 (실제로는 데이터베이스에서 조회)
const mockStudentPoints: StudentPoints[] = [
  {
    id: '1',
    name: '김학생',
    points: 150,
    transactions: [
      {
        id: '1',
        studentId: '1',
        type: 'earn',
        amount: 10,
        reason: '수업 출석',
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    id: '2',
    name: '이학생',
    points: 200,
    transactions: [
      {
        id: '2',
        studentId: '2',
        type: 'earn',
        amount: 10,
        reason: '수업 출석',
        timestamp: new Date().toISOString()
      }
    ]
  }
];

// 포인트 적립
export async function POST(request: NextRequest) {
  try {
    const { studentId, amount, reason } = await request.json();
    
    if (!studentId || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    const student = mockStudentPoints.find(s => s.id === studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 포인트 적립
    student.points += amount;
    
    // 거래 내역 기록
    const transaction: PointTransaction = {
      id: `tx_${Date.now()}`,
      studentId,
      type: 'earn',
      amount,
      reason,
      timestamp: new Date().toISOString()
    };
    
    student.transactions.push(transaction);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        points: student.points
      },
      transaction
    });

  } catch (error) {
    console.error('Error processing point transaction:', error);
    return NextResponse.json(
      { success: false, error: '포인트 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 포인트 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: '학생 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const student = mockStudentPoints.find(s => s.id === studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        points: student.points,
        transactions: student.transactions.slice(-10) // 최근 10개 거래만
      }
    });

  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { success: false, error: '포인트 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';

interface TaggingRequest {
  cardId: string;
  deviceId: string;
  location: string;
  action: 'check_in' | 'check_out';
}

interface TaggingUser {
  id: string;
  cardId: string;
  uid: string;
  name: string;
  role: 'student' | 'teacher' | 'staff' | 'admin';
  department: string;
  isCurrentlyIn: boolean;
}

interface TaggingLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'check_in' | 'check_out';
  timestamp: Date;
  deviceId: string;
  location: string;
}

// 시뮬레이션용 사용자 데이터
const mockUsers: Record<string, TaggingUser> = {
  'CARD-001': {
    id: 'student-001',
    cardId: 'CARD-001',
    uid: 'STU001',
    name: '김학생',
    role: 'student',
    department: '컴퓨터공학과',
    isCurrentlyIn: false
  },
  'CARD-002': {
    id: 'teacher-001',
    cardId: 'CARD-002',
    uid: 'TCH001',
    name: '박교수',
    role: 'teacher',
    department: '컴퓨터공학과',
    isCurrentlyIn: true
  },
  'CARD-003': {
    id: 'staff-001',
    cardId: 'CARD-003',
    uid: 'STF001',
    name: '이직원',
    role: 'staff',
    department: '행정팀',
    isCurrentlyIn: false
  }
};

// 시뮬레이션용 태깅 로그 저장소
let taggingLogs: TaggingLog[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: TaggingRequest = await request.json();
    const { cardId, deviceId, location, action } = body;

    // 사용자 확인
    const user = mockUsers[cardId];
    if (!user) {
      return NextResponse.json(
        { success: false, message: '등록되지 않은 카드입니다.' },
        { status: 404 }
      );
    }

    // 출근/퇴근 상태 확인
    if (action === 'check_in' && user.isCurrentlyIn) {
      return NextResponse.json(
        { success: false, message: '이미 출근 상태입니다.' },
        { status: 400 }
      );
    }

    if (action === 'check_out' && !user.isCurrentlyIn) {
      return NextResponse.json(
        { success: false, message: '이미 퇴근 상태입니다.' },
        { status: 400 }
      );
    }

    // 태깅 로그 생성
    const taggingLog: TaggingLog = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role === 'student' ? '학생' : user.role === 'teacher' ? '강사' : '직원',
      action,
      timestamp: new Date(),
      deviceId,
      location
    };

    // 로그 저장 (실제로는 데이터베이스에 저장)
    taggingLogs.unshift(taggingLog);
    if (taggingLogs.length > 100) {
      taggingLogs = taggingLogs.slice(0, 100); // 최근 100개만 유지
    }

    // 사용자 상태 업데이트
    user.isCurrentlyIn = action === 'check_in';

    const actionText = action === 'check_in' ? '출근' : '퇴근';

    return NextResponse.json({
      success: true,
      message: `${user.name}님 ${actionText} 처리되었습니다.`,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department,
        isCurrentlyIn: user.isCurrentlyIn
      },
      taggingLog
    });

  } catch (error) {
    console.error('태깅 처리 오류:', error);
    return NextResponse.json(
      { success: false, message: '태깅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 최근 태깅 로그 반환
    const recentLogs = taggingLogs.slice(0, 20); // 최근 20개

    return NextResponse.json({
      success: true,
      logs: recentLogs,
      totalCount: taggingLogs.length
    });

  } catch (error) {
    console.error('태깅 로그 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '태깅 로그 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
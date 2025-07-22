import { NextRequest, NextResponse } from 'next/server';

interface Student {
  id: string;
  name: string;
  uid: string;
  level: number;
  points: number;
}

interface Reservation {
  id: string;
  studentId: string;
  serviceName: string;
  teacherName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}

// 임시 데이터 (실제로는 데이터베이스에서 조회)
const mockStudents: Student[] = [
  { id: '1', name: '김학생', uid: 'STUDENT1234', level: 2, points: 150 },
  { id: '2', name: '이학생', uid: 'STUDENT5678', level: 3, points: 200 },
  { id: '3', name: '박학생', uid: 'STUDENT9012', level: 1, points: 100 },
];

const mockReservations: Reservation[] = [
  {
    id: '1',
    studentId: '1',
    serviceName: '기초 한국어',
    teacherName: '김선생님',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'confirmed'
  },
  {
    id: '2',
    studentId: '2',
    serviceName: '중급 한국어',
    teacherName: '이선생님',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'confirmed'
  }
];

// 태깅 이력 저장 (실제로는 데이터베이스에 저장)
const taggingHistory: Array<{
  uid: string;
  date: string;
  eventType: string;
  timestamp: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const { uid, timestamp } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'UID가 필요합니다' },
        { status: 400 }
      );
    }

    // 학생 조회
    const student = mockStudents.find(s => s.uid === uid);
    if (!student) {
      return NextResponse.json(
        { 
          success: false, 
          eventType: 'student_not_found',
          message: '등록되지 않은 UID입니다. 관리자에게 문의하세요.' 
        },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 태깅 이력 확인
    const todayTagging = taggingHistory.find(
      t => t.uid === uid && t.date === today
    );

    // 오늘 예약 확인
    const todayReservation = mockReservations.find(
      r => r.studentId === student.id && r.date === today && r.status === 'confirmed'
    );

    // 태깅 이벤트 타입 결정
    let eventType: string;
    let message: string;
    let reservation = null;
    let pointsEarned = 0;

    if (todayTagging) {
      // 이미 오늘 태깅한 경우
      eventType = 'already_registered';
      message = 'すでに本日の記録があります (이미 오늘의 기록이 있습니다)';
    } else if (todayReservation) {
      // 예약이 있는 경우 - 출석 확인
      eventType = 'attendance';
      message = '출석이 확인되었습니다!';
      
      // 예약 상태를 '완료'로 변경
      todayReservation.status = 'completed';
      
      // 포인트 적립 (예약 완료 시 10포인트)
      pointsEarned = 10;
      student.points += pointsEarned;
      
      reservation = todayReservation;
      
      // 태깅 이력 기록
      taggingHistory.push({
        uid,
        date: today,
        eventType: 'attendance',
        timestamp
      });
      
    } else {
      // 예약이 없는 경우
      eventType = 'no_reservation';
      message = '本日の予約がありません。出席を記録しますか？ (오늘 예약이 없습니다. 출석을 기록하시겠습니까?)';
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        level: student.level,
        points: student.points
      },
      reservation,
      eventType,
      message,
      pointsEarned,
      canManualAttendance: eventType === 'no_reservation'
    });

  } catch (error) {
    console.error('Error processing student tagging:', error);
    return NextResponse.json(
      { success: false, error: '태그 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
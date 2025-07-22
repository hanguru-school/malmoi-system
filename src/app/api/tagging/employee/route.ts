import { NextRequest, NextResponse } from 'next/server';

interface Employee {
  id: string;
  name: string;
  uid: string;
  role: 'teacher' | 'staff';
  transportationAllowance: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  transportationClaimed: boolean;
  transportationAmount: number;
}

interface Lesson {
  studentName: string;
  serviceName: string;
  time: string;
}

// 임시 데이터 (실제로는 데이터베이스에서 조회)
const mockEmployees: Employee[] = [
  { id: '1', name: '김선생님', uid: 'TEACHER1234', role: 'teacher', transportationAllowance: 1000 },
  { id: '2', name: '이사무직원', uid: 'STAFF5678', role: 'staff', transportationAllowance: 800 },
];

const mockAttendanceRecords: AttendanceRecord[] = [];

const mockTodayLessons: Lesson[] = [
  { studentName: '김학생', serviceName: '기초 한국어', time: '09:00' },
  { studentName: '이학생', serviceName: '중급 한국어', time: '10:00' },
  { studentName: '박학생', serviceName: '고급 한국어', time: '14:00' },
];

export async function POST(request: NextRequest) {
  try {
    const { uid, timestamp, type } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'UID가 필요합니다' },
        { status: 400 }
      );
    }

    // 직원 조회
    const employee = mockEmployees.find(e => e.uid === uid);
    if (!employee) {
      return NextResponse.json(
        { 
          success: false, 
          eventType: 'employee_not_found',
          message: '등록되지 않은 UID입니다. 관리자에게 문의하세요.' 
        },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date(timestamp);
    
    // 오늘 출근 기록 확인
    const todayAttendance = mockAttendanceRecords.find(
      a => a.employeeId === employee.id && a.date === today
    );

    // 태깅 이벤트 타입 결정
    let eventType: string;
    let message: string;
    let transportationAllowance = null;
    let todaySchedule = null;

    if (!todayAttendance) {
      // 첫 태깅 - 출근
      eventType = 'attendance';
      message = '출근을 환영합니다. 오늘도 즐겁고 활기찬 업무가 되길 바랍니다';
      
      // 출근 기록 생성
      const newAttendance: AttendanceRecord = {
        id: `att_${Date.now()}`,
        employeeId: employee.id,
        date: today,
        checkIn: timestamp,
        transportationClaimed: false,
        transportationAmount: 0
      };
      
      mockAttendanceRecords.push(newAttendance);
      
      // 선생님인 경우 오늘 수업 일정 제공
      if (employee.role === 'teacher') {
        todaySchedule = {
          lessons: mockTodayLessons,
          totalLessons: mockTodayLessons.length
        };
      }
      
    } else if (todayAttendance.checkOut) {
      // 이미 퇴근한 경우 - 재출근
      eventType = 're_attendance';
      message = '⚠️ 당일 출근 이력이 이미 존재합니다. 다시 출근하시겠습니까?';
      
      // 교통비 청구 옵션 제공
      transportationAllowance = {
        eligible: true,
        amount: employee.transportationAllowance,
        reason: '재출근 시 교통비 청구 가능'
      };
      
    } else {
      // 출근했지만 퇴근하지 않은 경우
      const checkInTime = new Date(todayAttendance.checkIn);
      const timeDiff = currentTime.getTime() - checkInTime.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      if (minutesDiff < 30) {
        // 30분 이내 - 퇴근 확인
        eventType = 'checkout_confirm';
        message = '퇴근 처리 됩니다. 원하시면 예를 눌러주세요';
      } else {
        // 30분 경과 - 자동 퇴근
        eventType = 'checkout';
        message = '퇴근 처리 되었습니다. 오늘도 고생 많으셨습니다.';
        
        todayAttendance.checkOut = timestamp;
        
        // 교통비 자동 청구 (하루 한 번)
        if (!todayAttendance.transportationClaimed) {
          todayAttendance.transportationClaimed = true;
          todayAttendance.transportationAmount = employee.transportationAllowance;
          
          transportationAllowance = {
            eligible: true,
            amount: employee.transportationAllowance,
            reason: '퇴근 시 교통비 자동 청구'
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        uid: employee.uid
      },
      eventType,
      message,
      transportationAllowance,
      todaySchedule,
      canShowSchedule: eventType === 'attendance' && employee.role === 'teacher'
    });

  } catch (error) {
    console.error('Error processing employee tagging:', error);
    return NextResponse.json(
      { success: false, error: '태그 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 
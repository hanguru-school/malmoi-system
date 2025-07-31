import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ReservationStatus } from '@prisma/client';

// 종료 시간 계산 함수
function getEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return endDate.toTimeString().slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 예약 생성 시작 ===');
    
    // 세션에서 사용자 정보 가져오기
    const session = request.cookies.get('auth-session');
    if (!session) {
      console.log('세션 없음');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
      console.log('세션 데이터:', sessionData.user?.id);
    } catch {
      console.log('세션 파싱 실패');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!sessionData?.user?.id) {
      console.log('유효하지 않은 세션 데이터');
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('요청 데이터:', body);
    
    const { date, time, duration, location, notes } = body;

    // Validation
    if (!date || !time || !duration || !location) {
      console.log('필수 필드 누락:', { date, time, duration, location });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 날짜와 시간 유효성 검사
    const reservationDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    console.log('예약 시간:', reservationDateTime);
    console.log('현재 시간:', now);
    
    if (reservationDateTime <= now) {
      console.log('과거 시간 예약 시도');
      return NextResponse.json(
        { error: 'Cannot book reservations in the past' },
        { status: 400 }
      );
    }

    // 데이터베이스 연결 확인
    try {
      await prisma.$connect();
      console.log('데이터베이스 연결 성공');
    } catch (dbError) {
      console.error('데이터베이스 연결 실패:', dbError);
      return NextResponse.json(
        { error: '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 중복 예약 확인
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        date: new Date(date),
        startTime: time,
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      }
    });

    if (existingReservation) {
      console.log('중복 예약 발견:', existingReservation.id);
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      include: { student: true }
    });

    console.log('사용자 정보:', user?.id, user?.student?.id);

    if (!user || !user.student) {
      console.log('학생 프로필 없음');
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Teacher 레코드 찾기 또는 생성
    let teacher = await prisma.teacher.findFirst();
    console.log('기존 강사:', teacher?.id);

    if (!teacher) {
      console.log('기본 강사 생성 중...');
      // 기본 Teacher 레코드 생성
      const defaultTeacherUser = await prisma.user.create({
        data: {
          name: '기본 강사',
          email: 'teacher@hanguru.school',
          password: 'hashed_password_placeholder',
          role: 'TEACHER',
          phone: '010-0000-0000'
        }
      });

      teacher = await prisma.teacher.create({
        data: {
          userId: defaultTeacherUser.id,
          name: '기본 강사',
          kanjiName: '基本講師',
          yomigana: 'きほんこうし',
          koreanName: '기본 강사',
          phone: '010-0000-0000',
          subjects: ['일본어'],
          hourlyRate: 30000
        }
      });
      console.log('새 강사 생성됨:', teacher.id);
    }

    // 예약 생성
    const reservationData = {
      date: new Date(date),
      startTime: time,
      endTime: getEndTime(time, duration),
      location: location,
      notes: notes || '',
      status: ReservationStatus.CONFIRMED,
      studentId: user.student.id,
      teacherId: teacher.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('예약 데이터:', reservationData);

    const reservation = await prisma.reservation.create({
      data: reservationData
    });

    console.log('예약 생성 성공:', reservation.id);

    return NextResponse.json({
      message: '예약이 성공적으로 완료되었습니다.',
      reservation: {
        id: reservation.id,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        location: reservation.location,
        status: reservation.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('예약 생성 오류:', error);
    
    // 더 자세한 오류 메시지
    let errorMessage = '예약 생성에 실패했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('prisma')) {
        errorMessage = '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('validation')) {
        errorMessage = '입력 정보가 올바르지 않습니다. 다시 확인해주세요.';
      } else if (error.message.includes('session')) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
      } else {
        errorMessage = `예약 생성 실패: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // 데이터베이스 연결 종료
    await prisma.$disconnect();
  }
} 
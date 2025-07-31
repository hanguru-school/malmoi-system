import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('=== 데이터베이스 연결 테스트 시작 ===');
  
  try {
    // 1. 데이터베이스 연결 테스트
    console.log('1. 데이터베이스 연결 테스트');
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 2. User 테이블 조회 테스트
    console.log('2. User 테이블 조회 테스트');
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    console.log('✅ User 테이블 조회 성공:', users.length, '개 레코드');

    // 3. Student 테이블 조회 테스트
    console.log('3. Student 테이블 조회 테스트');
    const students = await prisma.student.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        userId: true
      }
    });
    console.log('✅ Student 테이블 조회 성공:', students.length, '개 레코드');

    // 4. Teacher 테이블 조회 테스트
    console.log('4. Teacher 테이블 조회 테스트');
    const teachers = await prisma.teacher.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        userId: true
      }
    });
    console.log('✅ Teacher 테이블 조회 성공:', teachers.length, '개 레코드');

    // 5. Reservation 테이블 조회 테스트
    console.log('5. Reservation 테이블 조회 테스트');
    const reservations = await prisma.reservation.findMany({
      take: 5,
      select: {
        id: true,
        studentId: true,
        teacherId: true,
        date: true,
        status: true
      }
    });
    console.log('✅ Reservation 테이블 조회 성공:', reservations.length, '개 레코드');

    // 6. 스키마 정보 출력
    console.log('6. 스키마 정보');
    const tableInfo = {
      users: users.length,
      students: students.length,
      teachers: teachers.length,
      reservations: reservations.length
    };

    return NextResponse.json({
      success: true,
      message: '데이터베이스 연결 및 스키마 테스트 성공',
      database: {
        connection: 'OK',
        tables: tableInfo
      },
      sampleData: {
        users: users,
        students: students,
        teachers: teachers,
        reservations: reservations
      }
    });

  } catch (error) {
    console.error('=== 데이터베이스 테스트 오류 ===');
    console.error('오류 타입:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
    console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json({
      success: false,
      error: '데이터베이스 테스트 실패',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });

  } finally {
    try {
      await prisma.$disconnect();
      console.log('데이터베이스 연결 종료');
    } catch (disconnectError) {
      console.error('데이터베이스 연결 종료 실패:', disconnectError);
    }
  }
} 
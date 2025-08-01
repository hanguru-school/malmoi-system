import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, userId, deviceType, deviceName } = body;

    if (!uid || !userId || !deviceType || !deviceName) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        teacher: true,
        staff: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      );
    }

    // UID 중복 확인
    const existingUID = await prisma.uIDDevice.findFirst({
      where: { uid }
    });

    if (existingUID) {
      return NextResponse.json(
        { success: false, message: '이미 등록된 UID입니다.' },
        { status: 409 }
      );
    }

    // UID 디바이스 등록
    const uidDevice = await prisma.uIDDevice.create({
      data: {
        userId,
        uid,
        deviceType,
      },
    });

    // 사용자 UID 필드 업데이트 (첫 번째 등록인 경우)
    if (!user.uid) {
      await prisma.user.update({
        where: { id: userId },
        data: { uid },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'UID가 성공적으로 등록되었습니다.',
      uidDevice: {
        id: uidDevice.id,
        uid: uidDevice.uid,
        deviceType: uidDevice.deviceType,
        registeredAt: uidDevice.registeredAt,
        userName: user.name,
        userRole: user.role,
      },
    });

  } catch (error) {
    console.error('UID registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'UID 등록 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 필터 조건 구성
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    // UID 디바이스 목록 조회
    const devices = await prisma.uIDDevice.findMany({
      where,
      include: {
        user: {
          include: {
            student: true,
            teacher: true,
            staff: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // 총 개수 조회
    const totalCount = await prisma.uIDDevice.count({ where });

    return NextResponse.json({
      success: true,
      devices: devices.map(device => ({
        id: device.id,
        uid: device.uid,
        deviceType: device.deviceType,
        registeredAt: device.registeredAt,
        userId: device.userId,
        userName: device.user.name,
        userRole: device.user.role,
        studentName: device.user.student?.name,
        teacherName: device.user.teacher?.name,
        staffName: device.user.staff?.name,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('UID devices error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'UID 디바이스 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 
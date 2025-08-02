import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        subjects: true,
        hourlyRate: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      teachers,
    });
  } catch (error) {
    console.error("선생님 목록 조회 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "선생님 목록 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      kanjiName,
      yomigana,
      koreanName,
      subjects,
      hourlyRate,
      colorCode,
      availableDays,
      availableTimeSlots,
      isActive = true,
      assignedServices,
    } = body;

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        role: "TEACHER",
        password: "temp_password", // 실제로는 해시된 비밀번호를 생성해야 함
      },
    });

    // 선생님 생성
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        name,
        kanjiName,
        yomigana,
        koreanName,
        phone,
        subjects,
        hourlyRate,
        colorCode,
        availableDays,
        availableTimeSlots,
        isActive,
      },
      include: {
        user: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // 담당 서비스 연결
    if (assignedServices && assignedServices.length > 0) {
      await prisma.teacherService.createMany({
        data: assignedServices.map((serviceId: string) => ({
          teacherId: teacher.id,
          serviceId,
        })),
      });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("선생님 생성 실패:", error);
    return NextResponse.json(
      { error: "선생님 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}

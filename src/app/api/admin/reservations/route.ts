import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teachers = searchParams.get("teachers")?.split(",") || [];
    const locations = searchParams.get("locations")?.split(",") || [];
    const statuses = searchParams.get("statuses")?.split(",") || [];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 필터 조건 구성
    const where: any = {};

    if (teachers.length > 0) {
      where.teacherId = { in: teachers };
    }

    if (locations.length > 0) {
      where.location = { in: locations };
    }

    if (statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // 예약 데이터 조회
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        student: true,
        teacher: true,
      },
      orderBy: {
        date: "asc",
        startTime: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        location: reservation.location,
        notes: reservation.notes,
        student: reservation.student,
        teacher: reservation.teacher,
      })),
    });
  } catch (error) {
    console.error("예약 조회 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "예약 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, teacherId, date, startTime, endTime, location, notes } =
      body;

    // 필수 필드 검증
    if (!studentId || !teacherId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "필수 필드가 누락되었습니다." },
        { status: 400 },
      );
    }

    // 예약 생성
    const reservation = await prisma.reservation.create({
      data: {
        studentId,
        teacherId,
        date: new Date(date),
        startTime,
        endTime,
        location: location || "ONLINE",
        notes,
        status: "CONFIRMED",
      },
      include: {
        student: true,
        teacher: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "예약이 성공적으로 생성되었습니다.",
      reservation: {
        id: reservation.id,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        location: reservation.location,
        notes: reservation.notes,
        student: reservation.student,
        teacher: reservation.teacher,
      },
    });
  } catch (error) {
    console.error("예약 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "예약 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

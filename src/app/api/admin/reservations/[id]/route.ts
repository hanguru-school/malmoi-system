import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const {
      studentId,
      teacherId,
      date,
      startTime,
      endTime,
      status,
      location,
      notes,
    } = body;

    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        studentId,
        teacherId,
        date: new Date(date),
        startTime,
        endTime,
        status,
        location,
        notes,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("예약 수정 실패:", error);
    return NextResponse.json(
      { error: "예약 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.reservation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "예약이 삭제되었습니다." });
  } catch (error) {
    console.error("예약 삭제 실패:", error);
    return NextResponse.json(
      { error: "예약 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}

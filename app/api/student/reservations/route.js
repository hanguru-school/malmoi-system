import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import {
  createReservationByStudent,
  listReservationsForStudent,
} from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "학생 계정만 접근할 수 있습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const result = await listReservationsForStudent(session.user.id, {
    status: searchParams.get("status") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || 10),
  });

  return NextResponse.json({
    ok: true,
    reservations: result.items,
    pagination: result.pagination,
    lessonMinutes: result.lessonMinutes || null,
  });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "학생 계정만 접근할 수 있습니다." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const reservation = await createReservationByStudent(session.user.id, body);
    if (!reservation) {
      return NextResponse.json({ ok: false, error: "학생 정보를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, reservation });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "예약 생성 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}

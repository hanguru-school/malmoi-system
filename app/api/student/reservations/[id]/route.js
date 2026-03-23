import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { rescheduleReservationByStudent } from "../../../../../lib/auth/store";

export async function PATCH(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "학생 계정만 접근할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const reservation = await rescheduleReservationByStudent(session.user.id, id, body);
    if (!reservation) {
      return NextResponse.json({ ok: false, error: "예약 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, reservation });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "예약 변경 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}

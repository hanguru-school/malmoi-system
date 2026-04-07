import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { updateReservationByAdmin } from "../../../../../lib/auth/store";

export async function PATCH(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const reservation = await updateReservationByAdmin(id, body, {
      userId: session.user.id,
      role: session.user.role,
    });

    if (!reservation) {
      return NextResponse.json({ ok: false, error: "예약 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, reservation });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "예약 수정 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}

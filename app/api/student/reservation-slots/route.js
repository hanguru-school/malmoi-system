import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getReservationPolicy, listReservationSlotsForStudent } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "学生アカウントのみアクセスできます。" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const [slots, reservationPolicy] = await Promise.all([
    listReservationSlotsForStudent(session.user.id, {
      fromDate: searchParams.get("fromDate") || "",
      toDate: searchParams.get("toDate") || "",
    }),
    getReservationPolicy(),
  ]);

  return NextResponse.json({ ok: true, slots, reservationPolicy });
}

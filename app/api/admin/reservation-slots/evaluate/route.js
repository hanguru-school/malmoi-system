import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { listReservationSlotsWithBookingEvalForAdmin } from "../../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  try {
    const body = (await request.json()) || {};
    const fromDate = String(body.fromDate || "").trim();
    const toDate = String(body.toDate || fromDate || "").trim();
    if (!fromDate) {
      return NextResponse.json({ ok: false, error: "fromDate が必要です。" }, { status: 400 });
    }
    const slots = await listReservationSlotsWithBookingEvalForAdmin(
      { fromDate, toDate: toDate || fromDate, lessonMode: String(body.lessonMode || "").trim() },
      {
        lessonServiceId: String(body.lessonServiceId || "").trim(),
        studentId: String(body.studentId || "").trim(),
        instructorUserId: String(body.instructorUserId || "").trim(),
        lessonDeliveryType: String(body.lessonDeliveryType || "in_person").trim(),
      }
    );
    return NextResponse.json({ ok: true, slots });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "評価に失敗しました。" },
      { status: 400 }
    );
  }
}

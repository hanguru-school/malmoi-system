import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { getReservationCandidatesForBooking } from "../../../../../lib/auth/store";

/**
 * POST /api/admin/reservations/candidates
 * body: studentId, lessonTypeId | lessonServiceId, teacherId?, targetDate | fromDate+toDate, lessonMode?
 */
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
    const lessonTypeId = String(body.lessonTypeId || body.lessonServiceId || "").trim();
    const result = await getReservationCandidatesForBooking({
      targetDate: String(body.targetDate || body.date || "").slice(0, 10),
      fromDate: String(body.fromDate || "").slice(0, 10),
      toDate: String(body.toDate || "").slice(0, 10),
      lessonTypeId,
      studentId: String(body.studentId || "").trim(),
      teacherId: String(body.teacherId || "").trim(),
      lessonDeliveryType: String(body.lessonMode || body.lessonDeliveryType || "in_person").trim(),
      actorRole: "admin",
    });
    return NextResponse.json({ ok: result.ok !== false, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "候補の取得に失敗しました。" },
      { status: 400 }
    );
  }
}

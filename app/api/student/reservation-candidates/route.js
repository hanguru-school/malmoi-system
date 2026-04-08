import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getReservationCandidatesForBooking } from "../../../../lib/auth/store";

/**
 * GET /api/student/reservation-candidates?lessonTypeId=&date=&teacherId=&fromDate=&toDate=
 */
export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "学生のみアクセスできます。" }, { status: 403 });
  }
  const linkStudentId = String(session.student?.id || "").trim();
  if (!linkStudentId) {
    return NextResponse.json({ ok: false, error: "学生プロフィールがリンクされていません。" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const lessonTypeId = String(searchParams.get("lessonTypeId") || searchParams.get("lessonServiceId") || "").trim();
  const targetDate = String(searchParams.get("date") || searchParams.get("targetDate") || "").slice(0, 10);
  const fromDate = String(searchParams.get("fromDate") || "").slice(0, 10);
  const toDate = String(searchParams.get("toDate") || "").slice(0, 10);
  const teacherId = String(searchParams.get("teacherId") || "").trim();
  const lessonMode = String(searchParams.get("lessonMode") || "in_person").trim();

  try {
    const result = await getReservationCandidatesForBooking({
      targetDate: targetDate || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      lessonTypeId,
      studentId: linkStudentId,
      teacherId,
      lessonDeliveryType: lessonMode,
      actorRole: "student",
    });
    return NextResponse.json({ ok: result.ok !== false, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "候補の取得に失敗しました。" },
      { status: 400 }
    );
  }
}

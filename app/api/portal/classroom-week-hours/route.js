import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getClassroomWeekHoursForPortal } from "../../../../lib/auth/store";

const PORTAL_ROLES = new Set(["student", "teacher", "parent"]);

/**
 * GET /api/portal/classroom-week-hours
 * ログイン済みの学生・講師・保護者向け：教室週次営業の要約（管理画面と同じ曜日順・表記）
 */
export async function GET(request) {
  const session = await getApiSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  const role = String(session.user.role || "");
  if (!PORTAL_ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: "アクセスできません。" }, { status: 403 });
  }
  try {
    const data = await getClassroomWeekHoursForPortal();
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "取得に失敗しました。" }, { status: 500 });
  }
}

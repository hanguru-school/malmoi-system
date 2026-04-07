import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getStudentLessonMinutesUsageForPortal } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "学生アカウントのみ利用できます。" }, { status: 403 });
  }

  const usage = await getStudentLessonMinutesUsageForPortal(session.user.id);
  if (!usage) {
    return NextResponse.json({ ok: false, error: "学生情報が見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, usage });
}

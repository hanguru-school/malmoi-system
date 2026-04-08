import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listLessonTypesForStudent } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "学生のみアクセスできます。" }, { status: 403 });
  }

  const lessonTypes = await listLessonTypesForStudent();
  return NextResponse.json({ ok: true, lessonTypes });
}

import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listStudentsForTeacherOverview } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "先生のみアクセスできます。" }, { status: 403 });
  }
  const students = await listStudentsForTeacherOverview();
  return NextResponse.json({ ok: true, students });
}

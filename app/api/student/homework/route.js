import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listHomeworksForStudent } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "学生のみアクセスできます。" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const status = String(searchParams.get("status") || "").trim();
  const items = await listHomeworksForStudent(session.user.id, { status });
  if (!items) return NextResponse.json({ ok: false, error: "学生情報が見つかりません。" }, { status: 404 });
  return NextResponse.json({ ok: true, items });
}

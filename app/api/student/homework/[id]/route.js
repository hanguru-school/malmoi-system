import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { updateHomeworkByStudent } from "../../../../../lib/auth/store";

export async function PATCH(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "student") {
    return NextResponse.json({ ok: false, error: "学生のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = (await request.json()) || {};
    const item = await updateHomeworkByStudent(session.user.id, id, body);
    if (!item) return NextResponse.json({ ok: false, error: "対象宿題が見つかりません。" }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "宿題更新中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

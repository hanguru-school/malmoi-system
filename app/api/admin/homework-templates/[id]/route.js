import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { deleteHomeworkTemplate } from "../../../../../lib/auth/store";

export async function DELETE(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (!["admin", "teacher"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "権限がありません。" }, { status: 403 });
  }
  const { id } = await params;
  const ok = await deleteHomeworkTemplate(id, { userId: session.user.id, role: session.user.role });
  if (!ok) return NextResponse.json({ ok: false, error: "削除対象が見つかりません。" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

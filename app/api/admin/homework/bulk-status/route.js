import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { bulkUpdateHomeworkStatusByAdmin } from "../../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (!["admin", "teacher"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "権限がありません。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const result = await bulkUpdateHomeworkStatusByAdmin(body, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "一括状態更新に失敗しました。" },
      { status: 400 }
    );
  }
}

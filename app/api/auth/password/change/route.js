import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { changePasswordForUser } from "../../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }

  const body = await request.json();
  const result = await changePasswordForUser(session.user.id, body || {}, {
    requireCurrentPassword: body?.requireCurrentPassword !== false,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "パスワード変更に失敗しました。" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { commitPaymentForAdmin } from "../../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const actor = { userId: session.user.id, role: session.user.role };
    const result = await commitPaymentForAdmin(body, actor);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "登録に失敗しました。" }, { status: 400 });
  }
}

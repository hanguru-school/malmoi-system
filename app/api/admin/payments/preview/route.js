import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { previewPaymentForAdmin } from "../../../../../lib/auth/store";

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
    const data = await previewPaymentForAdmin(body);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "プレビューに失敗しました。" }, { status: 400 });
  }
}

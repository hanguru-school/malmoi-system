import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { sendPaymentOfficeSummaryMailForAdmin } from "../../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const preset = ["today", "week", "month"].includes(body.preset) ? body.preset : "today";
    const actor = { userId: session.user.id, role: session.user.role };
    const result = await sendPaymentOfficeSummaryMailForAdmin(actor, { preset });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "送信に失敗しました。" }, { status: 400 });
  }
}

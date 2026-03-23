import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../../lib/auth/api-session";
import { resendPaymentMailsForAdmin } from "../../../../../../../lib/auth/store";

export async function POST(request, context) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const params = await context.params;
  const transactionId = String(params?.transactionId || "").trim();
  if (!transactionId) {
    return NextResponse.json({ ok: false, error: "transactionId が必要です。" }, { status: 400 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const scope = ["student", "office", "both"].includes(body.scope) ? body.scope : "both";
    const actor = { userId: session.user.id, role: session.user.role };
    const result = await resendPaymentMailsForAdmin(transactionId, actor, { scope });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "再送に失敗しました。" }, { status: 400 });
  }
}

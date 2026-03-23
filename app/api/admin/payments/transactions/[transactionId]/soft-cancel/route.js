import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../../lib/auth/api-session";
import { softCancelPaymentTransactionForAdmin } from "../../../../../../../lib/auth/store";

export async function POST(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const transactionId = params?.transactionId || "";
    const reason = body?.reason || "";
    const actor = { userId: session.user.id, role: session.user.role };
    const result = await softCancelPaymentTransactionForAdmin(transactionId, reason, actor);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "取消に失敗しました。" }, { status: 400 });
  }
}

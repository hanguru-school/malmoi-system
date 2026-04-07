import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { rebuildPaymentStateFromEventsForAdmin } from "../../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const studentId = request.nextUrl.searchParams.get("studentId") || "";
    const asOf = request.nextUrl.searchParams.get("asOf") || "";
    const result = await rebuildPaymentStateFromEventsForAdmin({ studentId, asOf });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "再計算に失敗しました。" }, { status: 400 });
  }
}

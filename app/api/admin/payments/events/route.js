import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { listPaymentEventsForAdmin } from "../../../../../lib/auth/store";

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
    const limit = request.nextUrl.searchParams.get("limit") || "200";
    const fromDate = request.nextUrl.searchParams.get("fromDate") || "";
    const toDate = request.nextUrl.searchParams.get("toDate") || "";
    const items = await listPaymentEventsForAdmin({
      studentId,
      fromDate,
      toDate,
      limit: Number(limit),
    });
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "イベント取得に失敗しました。" }, { status: 400 });
  }
}

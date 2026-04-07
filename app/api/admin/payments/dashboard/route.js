import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { getSalesDashboardForAdmin } from "../../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const fromDate = request.nextUrl.searchParams.get("fromDate") || "";
  const toDate = request.nextUrl.searchParams.get("toDate") || "";
  const data = await getSalesDashboardForAdmin({ fromDate, toDate });
  return NextResponse.json({ ok: true, ...data });
}

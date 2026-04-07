import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { getSystemInfoSummaryForAdmin } from "../../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const info = await getSystemInfoSummaryForAdmin();
  return NextResponse.json({ ok: true, info });
}

import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { getMailLogByIdForAdmin } from "../../../../../lib/auth/store";

export async function GET(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  const log = await getMailLogByIdForAdmin(id);
  if (!log) return NextResponse.json({ ok: false, error: "対象ログがありません。" }, { status: 404 });
  return NextResponse.json({ ok: true, log });
}

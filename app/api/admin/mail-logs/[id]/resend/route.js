import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../lib/auth/api-session";
import { getMailLogByIdForAdmin } from "../../../../../../lib/auth/store";
import { resendMailFromLog } from "../../../../../../lib/auth/email";

export async function POST(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  const log = await getMailLogByIdForAdmin(id);
  if (!log) return NextResponse.json({ ok: false, error: "対象ログがありません。" }, { status: 404 });
  try {
    await resendMailFromLog(log);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "再送に失敗しました。" },
      { status: 400 }
    );
  }
}

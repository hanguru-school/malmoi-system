import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { sendNoticePublishedMail } from "../../../../../lib/auth/email";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const toEmail = String(body?.toEmail || "").trim().toLowerCase();
    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "送信先メールアドレスを入力してください。" }, { status: 400 });
    }
    await sendNoticePublishedMail({
      toEmail,
      noticeTitle: "システム設定テストメール",
      noticeSummary: "SMTP接続とメールテンプレート設定の確認メールです。",
      noticeUrl: String(body?.portalUrl || "").trim() || "https://portal.hanguru.school",
      recipientName: String(body?.recipientName || "").trim() || session.user.displayName || session.user.email,
      recipientRole: "admin",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "テストメール送信に失敗しました。" },
      { status: 400 }
    );
  }
}

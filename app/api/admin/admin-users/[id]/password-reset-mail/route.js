import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../lib/auth/api-session";
import { getMailBaseUrlFromRequest } from "../../../../../../lib/auth/http";
import { sendAdminPasswordResetMail } from "../../../../../../lib/auth/email";
import { superAdminCreateAdminPasswordResetToken } from "../../../../../../lib/auth/store";

export async function POST(request, { params }) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  if (String(session.user.adminRank || "").toUpperCase() !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "スーパー管理者のみ実行できます。" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const result = await superAdminCreateAdminPasswordResetToken(String(id || ""), {
      userId: session.user.id,
      role: session.user.role,
      adminRank: session.user.adminRank,
    });
    const baseUrl = getMailBaseUrlFromRequest(request);
    const resetUrl = `${baseUrl}/login/admin/password-reset/verify?token=${encodeURIComponent(result.rawToken)}`;
    const mail = await sendAdminPasswordResetMail({
      toEmail: result.toEmail,
      resetUrl,
      expiresAt: result.expiresAt,
    });
    if (!mail?.sent) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "メールを送信できませんでした。SMTP設定・テンプレート設定を確認するか、ログモードでリンクを確認してください。",
          mail,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, mail });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "送信に失敗しました。" },
      { status: 400 }
    );
  }
}

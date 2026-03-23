import { NextResponse } from "next/server";
import { getMailBaseUrlFromRequest, getRequestMeta } from "../../../../../lib/auth/http";
import { sendPasswordResetMail } from "../../../../../lib/auth/email";
import { requestPasswordResetByStudentIdentity } from "../../../../../lib/auth/store";

export async function POST(request) {
  try {
    const body = await request.json();
    const meta = getRequestMeta(request);
    const result = await requestPasswordResetByStudentIdentity({
      nameKanji: body?.nameKanji,
      phone: body?.phone,
      email: body?.email,
      requestIp: meta.requestIp,
      userAgent: meta.userAgent,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "入力情報を確認してください。" }, { status: 400 });
    }

    const baseUrl = getMailBaseUrlFromRequest(request);
    const resetUrl = `${baseUrl}/password-reset/verify?token=${encodeURIComponent(result.rawToken)}`;
    let mail = { attempted: false, sent: false, mode: "disabled", messageId: null };
    let mailError = null;
    try {
      mail = await sendPasswordResetMail({
        toEmail: result.user.email,
        resetUrl,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      mailError = error?.message || "mail_send_failed";
      console.error("[auth] password-reset mail send failed", {
        email: result.user.email,
        error: mailError,
      });
    }

    return NextResponse.json({ ok: true, mail, mailError });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "再設定メール送信中にエラーが発生しました。" }, { status: 500 });
  }
}

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

    if (mailError || !mail?.sent) {
      let errorMessage =
        "メールを送信できませんでした。しばらくしてから再度お試しの上、解決しない場合は教室までお問い合わせください。";
      if (mailError) {
        errorMessage =
          "メール送信に失敗しました。しばらくしてから再度お試しの上、解決しない場合は教室までお問い合わせください。";
      } else if (mail?.mode === "log") {
        errorMessage =
          "現在メールは送信されていません（ログモード）。管理者がサーバーログで再設定リンクを確認するか、SMTP設定を有効にしてください。";
      } else if (mail?.mode === "disabled") {
        errorMessage =
          "現在メール送信が無効です。管理者にお問い合わせください。";
      }
      return NextResponse.json({ ok: false, error: errorMessage, mail, mailError }, { status: 503 });
    }

    return NextResponse.json({ ok: true, mail });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "再設定メール送信中にエラーが発生しました。" }, { status: 500 });
  }
}

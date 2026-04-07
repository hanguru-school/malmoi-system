import { NextResponse } from "next/server";
import { getMailBaseUrlFromRequest, getRequestMeta } from "../../../../lib/auth/http";
import { startStudentRegistration } from "../../../../lib/auth/store";
import { sendLoginLinkMail } from "../../../../lib/auth/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const nameKanji = String(body?.nameKanji || "").trim();
    const nameFurigana = String(body?.nameFurigana || "").trim();

    if (!email || !email.includes("@") || !nameKanji || !nameFurigana) {
      return NextResponse.json({ ok: false, error: "お名前(漢字)・フリガナ・メールアドレスを入力してください。" }, { status: 400 });
    }

    const baseUrl = getMailBaseUrlFromRequest(request);
    const meta = getRequestMeta(request);
    const result = await startStudentRegistration({ email, nameKanji, nameFurigana, baseUrl, requestIp: meta.requestIp, userAgent: meta.userAgent });
    let mail = { attempted: false, sent: false, mode: "disabled", messageId: null };
    let mailError = null;
    try {
      mail = await sendLoginLinkMail({
        toEmail: email,
        loginUrl: result.loginUrl,
        expiresAt: result.expiresAt,
        nextPath: "/student/register/consent",
        purpose: "registration",
      });
    } catch (error) {
      mailError = error?.message || "mail_send_failed";
      console.error("[auth] start-registration mail send failed", {
        email,
        error: mailError,
      });
    }

    if (!mail?.sent) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "確認メール送信に失敗しました。メール設定(MAIL_SEND_MODE/SMTP/APP_BASE_URL)を確認してください。",
          mail,
          mailError,
        },
        { status: 503 }
      );
    }

    console.info(`[auth] registration link generated for ${email}: ${result.loginUrl}`);
    return NextResponse.json({
      ok: true,
      expiresAt: result.expiresAt,
      student: result.student,
      mail,
      mailError,
    });
  } catch (error) {
    console.error("[auth] start-registration failed", error);
    return NextResponse.json({ ok: false, error: "登録開始処理中にエラーが発生しました。" }, { status: 500 });
  }
}

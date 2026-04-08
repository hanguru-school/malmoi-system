import { NextResponse } from "next/server";
import { getMailBaseUrlFromRequest, getRequestMeta } from "../../../../../lib/auth/http";
import { sendAdminPasswordResetMail } from "../../../../../lib/auth/email";
import { requestAdminPasswordResetByEmail } from "../../../../../lib/auth/store";

const PUBLIC_OK_MESSAGE =
  "入力されたメールアドレス宛に、再設定方法を送信しました。届かない場合は迷惑メールフォルダもご確認ください。";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request) {
  const meta = getRequestMeta(request);
  try {
    const body = (await request.json()) || {};
    const email = String(body?.email || "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "有効なメールアドレスを入力してください。" },
        { status: 400 }
      );
    }

    await sleep(80 + Math.floor(Math.random() * 120));

    const result = await requestAdminPasswordResetByEmail({
      email,
      requestIp: meta.requestIp,
      userAgent: meta.userAgent,
    });

    if (result.ok && result.outcome === "mailed" && result.rawToken) {
      const baseUrl = getMailBaseUrlFromRequest(request);
      const resetUrl = `${baseUrl}/login/admin/password-reset/verify?token=${encodeURIComponent(result.rawToken)}`;
      try {
        const mail = await sendAdminPasswordResetMail({
          toEmail: result.toEmail,
          resetUrl,
          expiresAt: result.expiresAt,
        });
        if (!mail?.sent) {
          console.error("[auth] admin password-reset mail not sent", { mode: mail?.mode });
        }
      } catch (err) {
        console.error("[auth] admin password-reset mail send failed", { error: err?.message });
      }
    }

    return NextResponse.json({ ok: true, message: PUBLIC_OK_MESSAGE });
  } catch (error) {
    console.error("[auth] admin password-reset request error", error);
    await sleep(60);
    return NextResponse.json({ ok: true, message: PUBLIC_OK_MESSAGE });
  }
}

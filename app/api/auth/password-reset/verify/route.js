import { NextResponse } from "next/server";
import { getRequestMeta } from "../../../../../lib/auth/http";
import { consumePasswordResetTokenAndInitPassword, verifyPasswordResetToken } from "../../../../../lib/auth/store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get("token") || "");
  const result = await verifyPasswordResetToken(token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "トークンが無効です。" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, expiresAt: result.expiresAt });
}

export async function POST(request) {
  const body = await request.json();
  const token = String(body?.token || "");
  const meta = getRequestMeta(request);
  const result = await consumePasswordResetTokenAndInitPassword(token, {
    requestIp: meta.requestIp,
    userAgent: meta.userAgent,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "初期化に失敗しました。" }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    initialPasswordHint: result.initialPasswordHint || null,
    temporaryPassword: result.temporaryPassword || null,
  });
}

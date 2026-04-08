import { NextResponse } from "next/server";
import { verifyAdminPasswordResetToken } from "../../../../../lib/auth/store";

export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const token = String(body?.token || "").trim();
    if (!token) {
      return NextResponse.json({ ok: false, error: "トークンが無効です。" }, { status: 400 });
    }
    const result = await verifyAdminPasswordResetToken(token);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "トークンを確認できませんでした。" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, expiresAt: result.expiresAt });
  } catch {
    return NextResponse.json({ ok: false, error: "トークンの確認に失敗しました。" }, { status: 500 });
  }
}

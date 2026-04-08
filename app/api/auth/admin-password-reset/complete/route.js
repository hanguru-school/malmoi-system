import { NextResponse } from "next/server";
import { getRequestMeta } from "../../../../../lib/auth/http";
import { completeAdminPasswordReset } from "../../../../../lib/auth/store";

export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const meta = getRequestMeta(request);
    const token = String(body?.token || "").trim();
    if (!token) {
      return NextResponse.json({ ok: false, error: "トークンが無効です。" }, { status: 400 });
    }
    const result = await completeAdminPasswordReset(
      token,
      {
        newPassword: body?.newPassword,
        confirmPassword: body?.confirmPassword,
      },
      { requestIp: meta.requestIp, userAgent: meta.userAgent }
    );
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "再設定に失敗しました。" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "再設定処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { completeRoleInvitationByToken } from "../../../../lib/auth/store";

export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();
    const phone = String(body.phone || "").trim();
    const nameFurigana = String(body.nameFurigana || "").trim();
    if (!token || !password) {
      return NextResponse.json({ ok: false, error: "トークンとパスワードが必要です。" }, { status: 400 });
    }
    const result = await completeRoleInvitationByToken({
      rawToken: token,
      password,
      displayName,
      phone,
      nameFurigana,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "登録に失敗しました。" },
      { status: 400 }
    );
  }
}

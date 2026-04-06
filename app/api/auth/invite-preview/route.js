import { NextResponse } from "next/server";
import { getRoleInvitationPreviewByToken } from "../../../../lib/auth/store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get("token") || "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "トークンがありません。" }, { status: 400 });
  }
  const preview = await getRoleInvitationPreviewByToken(token);
  if (!preview.ok) {
    return NextResponse.json({ ok: false, error: preview.error || "無効な招待です。" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, preview });
}

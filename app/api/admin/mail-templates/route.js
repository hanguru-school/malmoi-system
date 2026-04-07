import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listMailTemplatesForAdmin, setMailTemplateActiveByAdmin } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const items = await listMailTemplatesForAdmin();
  return NextResponse.json({ ok: true, items });
}

export async function PATCH(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    await setMailTemplateActiveByAdmin(body.type, body.isActive !== false, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "更新に失敗しました。" }, { status: 400 });
  }
}

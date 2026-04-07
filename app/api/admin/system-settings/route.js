import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import {
  getSystemSettingsForAdmin,
  updateSystemSettingsSectionByAdmin,
} from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const settings = await getSystemSettingsForAdmin();
  return NextResponse.json({
    ok: true,
    settings,
    permissions: {
      canEditAll: String(session.user.adminRank || "").toUpperCase() === "SUPER_ADMIN",
      adminRank: session.user.adminRank || "ADMIN",
    },
  });
}

export async function PATCH(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const section = String(body?.section || "").trim();
    const patch = typeof body?.patch === "object" && body.patch ? body.patch : {};
    const result = await updateSystemSettingsSectionByAdmin(section, patch, {
      userId: session.user.id,
      role: session.user.role,
      adminRank: session.user.adminRank || "ADMIN",
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "設定更新中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

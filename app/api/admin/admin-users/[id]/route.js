import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { updateAdminUserProfileByAdmin } from "../../../../../lib/auth/store";

export async function PATCH(request, { params }) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = (await request.json()) || {};
    const result = await updateAdminUserProfileByAdmin(String(id || ""), body, {
      userId: session.user.id,
      role: session.user.role,
      adminRank: session.user.adminRank,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "更新に失敗しました。" },
      { status: 400 }
    );
  }
}

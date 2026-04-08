import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../lib/auth/api-session";
import { superAdminIssueTemporaryAdminPassword } from "../../../../../../lib/auth/store";

export async function POST(request, { params }) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  if (String(session.user.adminRank || "").toUpperCase() !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "スーパー管理者のみ実行できます。" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const result = await superAdminIssueTemporaryAdminPassword(String(id || ""), {
      userId: session.user.id,
      role: session.user.role,
      adminRank: session.user.adminRank,
    });
    return NextResponse.json({
      ok: true,
      temporaryPassword: result.temporaryPassword,
      email: result.email,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "仮パスワードの発行に失敗しました。" },
      { status: 400 }
    );
  }
}

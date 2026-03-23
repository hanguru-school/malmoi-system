import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { regenerateReservationSlotsByAdmin } from "../../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  try {
    const result = await regenerateReservationSlotsByAdmin({
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "スロット自動生成中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

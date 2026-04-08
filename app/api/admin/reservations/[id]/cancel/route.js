import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../lib/auth/api-session";
import { updateReservationByAdmin } from "../../../../../../lib/auth/store";

export async function POST(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = (await request.json().catch(() => ({}))) || {};
    const reservation = await updateReservationByAdmin(
      id,
      {
        status: "cancelled",
        memo: body.memo !== undefined ? body.memo : undefined,
      },
      { userId: session.user.id, role: session.user.role }
    );

    if (!reservation) {
      return NextResponse.json({ ok: false, error: "予約が見つかりません。" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, reservation });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "キャンセル処理中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

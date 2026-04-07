import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getReservationPolicy, updateReservationPolicyByAdmin } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  const reservationPolicy = await getReservationPolicy();
  return NextResponse.json({ ok: true, reservationPolicy });
}

export async function PATCH(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const reservationPolicy = await updateReservationPolicyByAdmin(body || {}, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ ok: true, reservationPolicy });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "予約ポリシー保存中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

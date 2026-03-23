import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import {
  createReservationSlotByAdmin,
  getReservationPolicy,
  listReservationSlotsForAdmin,
  listTeacherUsersForAdmin,
} from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const slots = await listReservationSlotsForAdmin({
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    lessonMode: searchParams.get("lessonMode") || "",
  });
  const [teachers, reservationPolicy] = await Promise.all([
    listTeacherUsersForAdmin(),
    getReservationPolicy(),
  ]);

  return NextResponse.json({ ok: true, slots, teachers, reservationPolicy });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const slot = await createReservationSlotByAdmin(body || {}, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ ok: true, slot });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "スロット追加中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

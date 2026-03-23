import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import {
  createPairReservationByAdmin,
  createReservationByAdmin,
  listReservationsForAdmin,
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
  const result = await listReservationsForAdmin({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    lessonMode: searchParams.get("lessonMode") || "",
    studentId: searchParams.get("studentId") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || 20),
  });

  return NextResponse.json({ ok: true, reservations: result.items, pagination: result.pagination });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const mode = String(body?.mode || "single").trim();
    if (mode === "pair") {
      const result = await createPairReservationByAdmin(body, {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (mode === "single") {
      const reservation = await createReservationByAdmin(body, {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json({ ok: true, reservation });
    }
    return NextResponse.json({ ok: false, error: "サポートされていない予約作成モードです。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "予約作成中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

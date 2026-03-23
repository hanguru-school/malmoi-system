import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { getPaymentStudentDetailForAdmin } from "../../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const studentId = request.nextUrl.searchParams.get("studentId") || "";
  if (!studentId) {
    return NextResponse.json({ ok: false, error: "studentId が必要です。" }, { status: 400 });
  }
  try {
    const data = await getPaymentStudentDetailForAdmin(studentId);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "取得に失敗しました。" }, { status: 400 });
  }
}

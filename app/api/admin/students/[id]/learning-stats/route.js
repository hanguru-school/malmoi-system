import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../lib/auth/api-session";
import { getStudentLearningStatsForAdmin } from "../../../../../../lib/auth/store";

export async function GET(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = String(searchParams.get("period") || "30").trim();
  const stats = await getStudentLearningStatsForAdmin(id, { period });
  if (!stats) {
    return NextResponse.json({ ok: false, error: "학생 정보를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, stats });
}

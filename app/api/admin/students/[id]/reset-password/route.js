import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../lib/auth/api-session";
import { resetStudentPasswordByAdmin } from "../../../../../../lib/auth/store";

export async function POST(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const result = await resetStudentPasswordByAdmin(id, {
    userId: session.user.id,
    role: session.user.role,
  });
  if (!result?.ok) {
    return NextResponse.json({ ok: false, error: result?.error || "임시 비밀번호 재설정에 실패했습니다." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...result });
}

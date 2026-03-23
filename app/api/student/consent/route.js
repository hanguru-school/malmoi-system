import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { agreeStudentConsentForUser } from "../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "student") return NextResponse.json({ ok: false, error: "学生アカウントのみ利用できます。" }, { status: 403 });

  const updated = await agreeStudentConsentForUser(session.user.id);
  if (!updated) return NextResponse.json({ ok: false, error: "学生情報が見つかりません。" }, { status: 404 });

  return NextResponse.json({ ok: true, student: updated });
}

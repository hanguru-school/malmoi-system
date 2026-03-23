import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { assignTeacherForUnassignedLessonNotesByAdmin } from "../../../../../lib/auth/store";

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const result = await assignTeacherForUnassignedLessonNotesByAdmin(
      body?.teacherUserId,
      {
        lessonUnitId: body?.lessonUnitId,
      },
      {
        userId: session.user.id,
        role: session.user.role,
      }
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "担当先生の一括設定中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

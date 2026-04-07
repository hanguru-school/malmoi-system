import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { deleteLessonNoteByAdmin, updateLessonNoteByAdmin } from "../../../../../lib/auth/store";

export async function PATCH(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "先生のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const note = await updateLessonNoteByAdmin(id, body || {}, {
      userId: session.user.id,
      role: session.user.role,
    });
    if (!note) return NextResponse.json({ ok: false, error: "レッスンノートが見つかりません。" }, { status: 404 });
    return NextResponse.json({ ok: true, note });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "レッスンノート更新中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "先生のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  const ok = await deleteLessonNoteByAdmin(id, {
    userId: session.user.id,
    role: session.user.role,
  });
  if (!ok) return NextResponse.json({ ok: false, error: "レッスンノートが見つかりません。" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

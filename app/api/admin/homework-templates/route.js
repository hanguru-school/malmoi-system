import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import {
  createHomeworkTemplate,
  listHomeworkTemplates,
} from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (!["admin", "teacher"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "権限がありません。" }, { status: 403 });
  }
  const items = await listHomeworkTemplates({ userId: session.user.id, role: session.user.role });
  return NextResponse.json({ ok: true, items });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (!["admin", "teacher"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "権限がありません。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const item = await createHomeworkTemplate(body, { userId: session.user.id, role: session.user.role });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "テンプレート作成に失敗しました。" },
      { status: 400 }
    );
  }
}

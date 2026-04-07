import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getTeacherAvailabilityForSelf, updateTeacherAvailabilityBySelf } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "講師のみアクセスできます。" }, { status: 403 });
  }
  const data = await getTeacherAvailabilityForSelf(session.user.id);
  if (!data) {
    return NextResponse.json({ ok: false, error: "データを取得できません。" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(request) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "講師のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const result = await updateTeacherAvailabilityBySelf(
      session.user.id,
      { weekly: body.weekly, exceptions: body.exceptions },
      { userId: session.user.id, role: session.user.role }
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "更新に失敗しました。" },
      { status: 400 }
    );
  }
}

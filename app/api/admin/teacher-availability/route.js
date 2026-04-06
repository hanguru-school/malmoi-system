import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listTeacherAvailabilityForAdmin, updateTeacherAvailabilityByAdmin } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const profiles = await listTeacherAvailabilityForAdmin();
  return NextResponse.json({ ok: true, profiles });
}

export async function PATCH(request) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const teacherUserId = String(body.teacherUserId || "").trim();
    if (!teacherUserId) {
      return NextResponse.json({ ok: false, error: "teacherUserId が必要です。" }, { status: 400 });
    }
    const result = await updateTeacherAvailabilityByAdmin(
      teacherUserId,
      {
        weekly: body.weekly,
        exceptions: body.exceptions,
        adminLocks: body.adminLocks,
      },
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

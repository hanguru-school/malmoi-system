import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import {
  getStudentByIdForAdmin,
  updateStudentByAdmin,
} from "../../../../../lib/auth/store";

export async function GET(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const student = await getStudentByIdForAdmin(id);
  if (!student) {
    return NextResponse.json({ ok: false, error: "학생 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, student });
}

export async function PATCH(request, { params }) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  try {
    const student = await updateStudentByAdmin(id, body, {
      userId: session.user.id,
      role: session.user.role,
    });

    if (!student) {
      return NextResponse.json({ ok: false, error: "학생 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, student });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新に失敗しました。";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

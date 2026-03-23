import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import {
  listPointConversionRulesForAdmin,
  listPointTimeConversionRulesForAdmin,
  updatePointConversionRulesForAdmin,
  updatePointTimeConversionRulesForAdmin,
} from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  const [rules, pointTimeRules] = await Promise.all([
    listPointConversionRulesForAdmin(),
    listPointTimeConversionRulesForAdmin(),
  ]);
  return NextResponse.json({ ok: true, rules, pointTimeRules });
}

export async function PATCH(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = { userId: session.user.id, role: session.user.role };
    const rules = await updatePointConversionRulesForAdmin(body?.rules || [], actor);
    const pointTimeRules = await updatePointTimeConversionRulesForAdmin(body?.pointTimeRules || [], actor);
    return NextResponse.json({ ok: true, rules, pointTimeRules });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "換算ルール保存中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

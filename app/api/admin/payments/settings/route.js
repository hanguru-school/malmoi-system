import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import {
  getPaymentSettingsForAdmin,
  updatePaymentGlobalRuleByAdmin,
  upsertPaymentRuleTemplateByAdmin,
  setStudentPaymentAssignmentByAdmin,
  bulkSetPaymentAssignmentsByAdmin,
} from "../../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const data = await getPaymentSettingsForAdmin();
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const actor = { userId: session.user.id, role: session.user.role };
  try {
    const body = await request.json();
    const action = String(body?.action || "").trim();
    if (action === "update_global") {
      const global = await updatePaymentGlobalRuleByAdmin(body.patch || {}, actor);
      return NextResponse.json({ ok: true, global });
    }
    if (action === "upsert_template") {
      const template = await upsertPaymentRuleTemplateByAdmin(body.template || {}, actor);
      return NextResponse.json({ ok: true, template });
    }
    if (action === "assign") {
      const row = await setStudentPaymentAssignmentByAdmin(body.assignment || {}, actor);
      return NextResponse.json({ ok: true, assignment: row });
    }
    if (action === "bulk_assign") {
      const result = await bulkSetPaymentAssignmentsByAdmin(body || {}, actor);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ ok: false, error: "不明な action です。" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "保存に失敗しました。" }, { status: 400 });
  }
}

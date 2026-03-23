import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listPaymentTransactionsForStudent } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request, { preferredRoles: ["student"], strictRoles: true });
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  const items = await listPaymentTransactionsForStudent(session.user.id);
  return NextResponse.json({ ok: true, items });
}

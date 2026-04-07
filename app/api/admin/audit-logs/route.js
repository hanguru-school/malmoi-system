import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listAuditLogsForAdmin } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const result = await listAuditLogsForAdmin({
    action: searchParams.get("action") || "",
    targetType: searchParams.get("targetType") || "",
    studentId: searchParams.get("studentId") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || searchParams.get("limit") || 30),
  });

  return NextResponse.json({
    ok: true,
    logs: result.items,
    pagination: result.pagination,
  });
}

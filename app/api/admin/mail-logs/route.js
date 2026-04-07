import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listMailLogsForAdmin } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const result = await listMailLogsForAdmin({
    type: searchParams.get("type") || "",
    status: searchParams.get("status") || "",
    toEmail: searchParams.get("toEmail") || "",
    recipientName: searchParams.get("recipientName") || "",
    studentName: searchParams.get("studentName") || "",
    parentName: searchParams.get("parentName") || "",
    studentId: searchParams.get("studentId") || "",
    parentId: searchParams.get("parentId") || "",
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


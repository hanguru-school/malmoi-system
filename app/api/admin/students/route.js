import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { listStudentsForAdmin } from "../../../../lib/auth/store";

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    q: searchParams.get("q") || "",
    registrationStatus: searchParams.get("registrationStatus") || "",
    consentStatus: searchParams.get("consentStatus") || "",
    linked: searchParams.get("linked") || "",
  };
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  const result = await listStudentsForAdmin(filters, { page, pageSize });
  return NextResponse.json({
    ok: true,
    students: result.items,
    pagination: result.pagination,
    filters,
  });
}

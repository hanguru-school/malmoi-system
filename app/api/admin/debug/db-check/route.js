import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { buildStorageHealthReport } from "../../../../../lib/admin/storage-health";

/**
 * 永続化ストア診断（本プロジェクトは Prisma / DATABASE_URL 非使用）。
 * 管理者セッション必須。接続文字列やファイル絶対パスは返さない。
 */
export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  try {
    const report = await buildStorageHealthReport();
    return NextResponse.json({ ok: report.ok, report });
  } catch (error) {
    console.error("[admin/debug/db-check]", error);
    return NextResponse.json(
      {
        ok: false,
        error: "ストア診断の取得に失敗しました。",
        detail: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined,
      },
      { status: 500 }
    );
  }
}

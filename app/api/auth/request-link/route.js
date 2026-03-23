import { NextResponse } from "next/server";

export async function POST(request) {
  return NextResponse.json(
    {
      ok: false,
      error: "ログインリンク方式は終了しました。IDとパスワードでログインしてください。",
      code: "login_link_disabled",
    },
    { status: 410 }
  );
}

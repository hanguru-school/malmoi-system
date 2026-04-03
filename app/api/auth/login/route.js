import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getRequestMeta, isHttpsRequest } from "../../../../lib/auth/http";
import { loginWithPassword } from "../../../../lib/auth/store";

export async function POST(request) {
  try {
    const body = await request.json();
    const meta = getRequestMeta(request);
    const result = await loginWithPassword({
      loginId: body?.loginId,
      password: body?.password,
      role: body?.role || null,
      requestIp: meta.requestIp,
      userAgent: meta.userAgent,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "ログインに失敗しました。" }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      nextPath: result.nextPath,
      user: result.user,
    });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: isHttpsRequest(request),
      path: "/",
      maxAge: Number(process.env.AUTH_SESSION_TTL_HOURS || 24 * 7) * 60 * 60,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: "ログイン中にエラーが発生しました。" }, { status: 500 });
  }
}

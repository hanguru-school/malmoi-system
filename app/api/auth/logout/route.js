import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "../../../../lib/auth/http";
import { clearSession } from "../../../../lib/auth/store";

export async function POST(request) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  await clearSession(sessionToken);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}

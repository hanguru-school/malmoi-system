import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "../../../../lib/auth/http";
import { getSessionUser } from "../../../../lib/auth/store";

export async function GET(request) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionInfo = await getSessionUser(sessionToken);

  if (!sessionInfo) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: sessionInfo.user,
    session: sessionInfo.session,
  });
}

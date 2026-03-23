import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { SESSION_ROLES } from "../../../../lib/auth/http";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedRole = String(searchParams.get("role") || "").trim().toLowerCase();
  const preferredRoles = SESSION_ROLES.includes(requestedRole) ? [requestedRole] : [];
  const sessionInfo = await getApiSession(request, { preferredRoles, strictRoles: preferredRoles.length > 0 });

  if (!sessionInfo) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: sessionInfo.user,
    session: sessionInfo.session,
  });
}

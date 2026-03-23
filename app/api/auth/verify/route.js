import { NextResponse } from "next/server";
import { applySessionCookies, getMailBaseUrlFromRequest, getRequestMeta, isHttpsRequest } from "../../../../lib/auth/http";
import { consumeLoginToken } from "../../../../lib/auth/store";

function safeNextPath(nextPath) {
  if (!nextPath) return null;
  return String(nextPath).startsWith("/") ? String(nextPath) : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get("token") || "").trim();
  const requestedNext = safeNextPath(searchParams.get("next"));
  const meta = getRequestMeta(request);
  const baseUrl = getMailBaseUrlFromRequest(request);

  if (!token) {
    const url = new URL("/student/register/start", baseUrl);
    url.searchParams.set("error", "token_missing");
    return NextResponse.redirect(url);
  }

  const result = await consumeLoginToken({ rawToken: token, requestIp: meta.requestIp, userAgent: meta.userAgent });

  if (!result.ok) {
    const url = new URL("/student/register/start", baseUrl);
    url.searchParams.set("error", result.reason);
    return NextResponse.redirect(url);
  }

  const nextPath = requestedNext || result.nextPath || "/student/register/consent";
  const destination = new URL(nextPath, baseUrl);
  const response = NextResponse.redirect(destination);
  applySessionCookies(response, {
    sessionToken: result.sessionToken,
    role: result.user?.role,
    secure: isHttpsRequest(request),
    maxAge: Number(process.env.AUTH_SESSION_TTL_HOURS || 24 * 7) * 60 * 60,
  });
  return response;
}

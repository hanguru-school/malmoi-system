import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getMailBaseUrlFromRequest, getRequestMeta, isHttpsRequest } from "../../../../lib/auth/http";
import { consumeLoginToken } from "../../../../lib/auth/store";
import { registrationStartPathWithError } from "../../../../lib/student/registrationNavPaths.js";

function safeNextPath(nextPath) {
  if (!nextPath) return null;
  return String(nextPath).startsWith("/") ? String(nextPath) : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get("token") || "").trim();
  const requestedNext = safeNextPath(searchParams.get("next"));
  const uiParam = String(searchParams.get("ui") || "").trim().toLowerCase();
  const meta = getRequestMeta(request);
  const baseUrl = getMailBaseUrlFromRequest(request);

  if (!token) {
    const url = new URL(registrationStartPathWithError("token_missing"), baseUrl);
    return NextResponse.redirect(url);
  }

  const result = await consumeLoginToken({ rawToken: token, requestIp: meta.requestIp, userAgent: meta.userAgent });

  if (!result.ok) {
    const url = new URL(registrationStartPathWithError(result.reason), baseUrl);
    return NextResponse.redirect(url);
  }

  const nextPath = requestedNext || result.nextPath || "/student/register/consent";
  let destination;
  try {
    destination = new URL(nextPath, baseUrl);
  } catch {
    destination = new URL("/student/register/consent", baseUrl);
  }
  if ((uiParam === "v2" || uiParam === "v1") && !destination.searchParams.has("ui")) {
    destination.searchParams.set("ui", uiParam);
  }
  const response = NextResponse.redirect(destination);
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
}

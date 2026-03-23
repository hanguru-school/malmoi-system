import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAMES,
  SESSION_ROLES,
  clearSessionCookies,
  clearSessionCookiesByRoles,
  getRoleSessionCookieName,
} from "../../../../lib/auth/http";
import { clearSession } from "../../../../lib/auth/store";

async function readRequestedRoles(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return [];
  try {
    const body = await request.json();
    const value = body?.role || body?.roles;
    const requestedRoles = Array.isArray(value) ? value : [value];
    return requestedRoles
      .map((role) => String(role || "").trim().toLowerCase())
      .filter((role) => SESSION_ROLES.includes(role));
  } catch {
    return [];
  }
}

export async function POST(request) {
  const requestedRoles = await readRequestedRoles(request);
  const targetCookieNames = requestedRoles.length
    ? requestedRoles.map((role) => getRoleSessionCookieName(role))
    : SESSION_COOKIE_NAMES;
  const sessionTokens = targetCookieNames.map((name) => request.cookies.get(name)?.value).filter(Boolean);
  const uniqueTokens = [...new Set(sessionTokens)];
  await Promise.all(uniqueTokens.map((token) => clearSession(token)));

  const response = NextResponse.json({ ok: true });
  if (requestedRoles.length) {
    clearSessionCookiesByRoles(response, requestedRoles);
  } else {
    clearSessionCookies(response);
  }

  return response;
}

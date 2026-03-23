export const SESSION_COOKIE_NAME = "malmoi_session";
export const SESSION_ROLES = ["student", "parent", "teacher", "admin"];
export const ROLE_SESSION_COOKIE_NAMES = {
  student: "malmoi_session_student",
  parent: "malmoi_session_parent",
  teacher: "malmoi_session_teacher",
  admin: "malmoi_session_admin",
};
export const SESSION_COOKIE_NAMES = [
  SESSION_COOKIE_NAME,
  ...SESSION_ROLES.map((role) => ROLE_SESSION_COOKIE_NAMES[role]),
];
const DEFAULT_MAIL_BASE_URL = "https://portal.hanguru.blog";
const LEGACY_PORTAL_HOST = "portal.hanguru.school";
const CANONICAL_PORTAL_HOST = "portal.hanguru.blog";

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function normalizePortalDomain(value) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    if (String(url.hostname || "").toLowerCase() === LEGACY_PORTAL_HOST) {
      url.hostname = CANONICAL_PORTAL_HOST;
      url.protocol = "https:";
    }
    return normalizeBaseUrl(url.toString());
  } catch {
    return normalized;
  }
}

function isLocalLikeHost(hostname) {
  const lower = String(hostname || "").toLowerCase();
  return (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower.startsWith("192.168.") ||
    lower.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)
  );
}

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return SESSION_ROLES.includes(normalized) ? normalized : null;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function getRoleSessionCookieName(role) {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return SESSION_COOKIE_NAME;
  return ROLE_SESSION_COOKIE_NAMES[normalizedRole];
}

export function getPreferredSessionCookieNames(preferredRoles = []) {
  const roles = Array.isArray(preferredRoles) ? preferredRoles : [preferredRoles];
  const roleCookieNames = roles.map((role) => getRoleSessionCookieName(role));
  return unique([...roleCookieNames, SESSION_COOKIE_NAME, ...SESSION_COOKIE_NAMES]);
}

export function getSessionTokenFromCookieStore(cookieStore, options = {}) {
  const strictRoles = Boolean(options.strictRoles);
  const roles = Array.isArray(options.preferredRoles) ? options.preferredRoles : [options.preferredRoles];
  const strictNames = unique(roles.map((role) => getRoleSessionCookieName(role)));
  const names =
    strictRoles && strictNames.length
      ? strictNames
      : getPreferredSessionCookieNames(options.preferredRoles || []);
  for (const name of names) {
    const token = cookieStore.get(name)?.value;
    if (token) return token;
  }
  return null;
}

export function getSessionTokenFromRequest(request, options = {}) {
  return getSessionTokenFromCookieStore(request.cookies, options);
}

export function applySessionCookies(response, options = {}) {
  const roleCookieName = getRoleSessionCookieName(options.role);
  const common = {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(options.secure),
    path: options.path || "/",
    maxAge: options.maxAge,
  };
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: options.sessionToken || "",
    ...common,
  });
  if (roleCookieName !== SESSION_COOKIE_NAME) {
    response.cookies.set({
      name: roleCookieName,
      value: options.sessionToken || "",
      ...common,
    });
  }
}

export function clearSessionCookies(response) {
  for (const cookieName of SESSION_COOKIE_NAMES) {
    response.cookies.set({
      name: cookieName,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }
}

export function clearSessionCookiesByRoles(response, roles = []) {
  const normalizedRoles = (Array.isArray(roles) ? roles : [roles])
    .map((role) => normalizeRole(role))
    .filter(Boolean);
  const targetCookieNames = normalizedRoles.length
    ? unique(normalizedRoles.map((role) => ROLE_SESSION_COOKIE_NAMES[role]))
    : SESSION_COOKIE_NAMES;
  for (const cookieName of targetCookieNames) {
    response.cookies.set({
      name: cookieName,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }
}

export function inferRoleFromPathname(pathname) {
  const value = String(pathname || "");
  if (value.startsWith("/api/admin") || value.startsWith("/admin")) return "admin";
  if (value.startsWith("/api/student") || value.startsWith("/student")) return "student";
  if (value.startsWith("/api/teacher") || value.startsWith("/teacher")) return "teacher";
  if (value.startsWith("/api/parent") || value.startsWith("/parent")) return "parent";
  return null;
}

export function getRequestMeta(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const requestIp = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : request.headers.get("x-real-ip");

  return {
    requestIp: requestIp || null,
    userAgent: request.headers.get("user-agent"),
  };
}

export function getBaseUrlFromRequest(request) {
  const explicit = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL;
  if (explicit) return normalizeBaseUrl(explicit);

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

export function getMailBaseUrlFromRequest(request) {
  const explicitMail =
    process.env.MAIL_LINK_BASE_URL ||
    process.env.APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL;
  if (explicitMail) return normalizePortalDomain(explicitMail);

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_MAIL_BASE_URL;
  }

  const baseFromRequest = getBaseUrlFromRequest(request);
  try {
    const url = new URL(baseFromRequest);
    if (isLocalLikeHost(url.hostname)) return DEFAULT_MAIL_BASE_URL;
    return normalizePortalDomain(baseFromRequest);
  } catch {
    return DEFAULT_MAIL_BASE_URL;
  }
}

export function isHttpsRequest(request) {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto === "https";
  return process.env.NODE_ENV === "production";
}

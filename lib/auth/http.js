export const SESSION_COOKIE_NAME = "malmoi_session";
const DEFAULT_MAIL_BASE_URL = "https://portal.hanguru.blog";

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function normalizePortalDomain(value) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    url.protocol = "https:";
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

import { getSessionTokenFromRequest, inferRoleFromPathname } from "./http";
import { getSessionUser } from "./store";

function inferRoleFromReferer(request) {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return inferRoleFromPathname(url.pathname);
  } catch {
    return null;
  }
}

export async function getApiSession(request, options = {}) {
  const preferredRoles = Array.isArray(options.preferredRoles)
    ? options.preferredRoles
    : options.preferredRoles
      ? [options.preferredRoles]
      : [];
  if (!preferredRoles.length) {
    const pathRole = inferRoleFromPathname(request.nextUrl?.pathname);
    if (pathRole) preferredRoles.push(pathRole);
  }
  if (!preferredRoles.length) {
    const refererRole = inferRoleFromReferer(request);
    if (refererRole) preferredRoles.push(refererRole);
  }
  const strictRoles =
    options.strictRoles === true || (options.strictRoles !== false && preferredRoles.length > 0);
  const token = getSessionTokenFromRequest(request, { preferredRoles, strictRoles });
  return getSessionUser(token);
}

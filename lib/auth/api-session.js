import { SESSION_COOKIE_NAME } from "./http";
import { getSessionUser } from "./store";

export async function getApiSession(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return getSessionUser(token);
}

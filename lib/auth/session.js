import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "./http";
import { getSessionUser } from "./store";

export async function getOptionalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSessionUser(token);
}

export async function requireSession() {
  const session = await getOptionalSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(allowedRoles) {
  const session = await requireSession();
  if (session.user?.mustChangePassword) redirect("/password/change-required");
  if (!allowedRoles.includes(session.user.role)) redirect("/login/next");
  return session;
}

export async function requireStudentRegistrationSession() {
  const session = await getOptionalSession();
  if (!session || session.user?.role !== "student" || !session.student) {
    redirect("/student/register/start");
  }
  if (session.student.registrationStatus === "completed") {
    redirect("/student");
  }
  return session;
}

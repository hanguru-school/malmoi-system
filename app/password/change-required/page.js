import { redirect } from "next/navigation";
import PasswordChangeRequiredForm from "./PasswordChangeRequiredForm";
import { requireSession } from "../../../lib/auth/session";

export default async function PasswordChangeRequiredPage() {
  const session = await requireSession();
  if (!session.user?.mustChangePassword) {
    redirect(session.nextPath || "/login/next");
  }
  return <PasswordChangeRequiredForm />;
}

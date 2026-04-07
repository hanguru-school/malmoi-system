import { redirect } from "next/navigation";
import { requireSession } from "../../../lib/auth/session";

export default async function LoginNextPage() {
  const session = await requireSession();
  redirect(session.nextPath || "/student");
}

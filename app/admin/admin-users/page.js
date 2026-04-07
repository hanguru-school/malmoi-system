import { redirect } from "next/navigation";

export default function AdminUsersLegacyRedirectPage() {
  redirect("/admin/settings/accounts");
}

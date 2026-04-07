"use client";

import { usePathname } from "next/navigation";
import AdminTopNav from "../AdminTopNav";

export default function SettingsAdminNav() {
  const path = usePathname() || "/admin/settings/classroom";
  return <AdminTopNav currentPath={path} />;
}

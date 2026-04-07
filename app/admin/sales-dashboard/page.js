import { redirect } from "next/navigation";

/** @deprecated 統計は /admin/payments/statistics へ統合 */
export default function SalesDashboardLegacyRedirect() {
  redirect("/admin/payments/statistics");
}

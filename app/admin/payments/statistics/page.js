import { requireRole } from "../../../../lib/auth/session";
import PaymentStatisticsClient from "../PaymentStatisticsClient";

export default async function AdminPaymentStatisticsPage() {
  await requireRole(["admin"]);
  return <PaymentStatisticsClient />;
}

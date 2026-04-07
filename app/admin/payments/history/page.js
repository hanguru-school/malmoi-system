import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import { requireRole } from "../../../../lib/auth/session";
import AdminTopNav from "../../AdminTopNav";
import AdminPaymentsSubNav from "../AdminPaymentsSubNav";
import PaymentHistoryClient from "../PaymentHistoryClient";

export default async function AdminPaymentHistoryPage() {
  await requireRole(["admin"]);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>決済管理 — 履歴</h1>
        <p className={styles.description}>保存済みの決済・調整・付与を一覧します（読み取り中心）。</p>
        <AdminTopNav currentPath="/admin/payments/history" />
        <AdminPaymentsSubNav />
        <PaymentHistoryClient />
      </main>
    </div>
  );
}

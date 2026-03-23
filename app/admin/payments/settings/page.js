import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import { requireRole } from "../../../../lib/auth/session";
import { getPaymentSettingsForAdmin } from "../../../../lib/auth/store";
import AdminTopNav from "../../AdminTopNav";
import AdminPaymentsSubNav from "../AdminPaymentsSubNav";
import PaymentSettingsClient from "../PaymentSettingsClient";

export default async function AdminPaymentSettingsPage() {
  await requireRole(["admin"]);
  const initial = await getPaymentSettingsForAdmin();

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>決済管理 — 設定</h1>
        <p className={styles.description}>
          今後の決済に適用されるルールです。既存の決済結果は変更されません。個別設定がある学生は個別が優先されます。
        </p>
        <AdminTopNav currentPath="/admin/payments/settings" />
        <AdminPaymentsSubNav />
        <PaymentSettingsClient initial={initial} />
      </main>
    </div>
  );
}

import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import { requireRole } from "../../../../lib/auth/session";
import AdminTopNav from "../../AdminTopNav";
import AdminPaymentsSubNav from "../AdminPaymentsSubNav";
import PaymentInputClient from "../PaymentInputClient";

export default async function AdminPaymentInputPage() {
  await requireRole(["admin"]);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>決済管理 — 入力</h1>
        <p className={styles.description}>
          学生を選び、カード形式で決済・調整を登録します。既存の取引レコードは変更されません（取消は新規取引で相殺）。
        </p>
        <AdminTopNav currentPath="/admin/payments/input" />
        <AdminPaymentsSubNav />
        <PaymentInputClient />
      </main>
    </div>
  );
}

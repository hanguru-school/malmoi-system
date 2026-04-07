import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import AdminNoticesPanel from "./AdminNoticesPanel";
import AdminTopNav from "../AdminTopNav";

export default async function AdminNoticesPage() {
  await requireRole(["admin"]);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>お知らせ管理</h1>
        <p className={styles.description}>
          お知らせの作成・修正・公開/非公開・削除を管理し、学生画面の表示状態を確認できます。
        </p>
        <AdminTopNav currentPath="/admin/notices" />
        <AdminNoticesPanel />
      </main>
    </div>
  );
}

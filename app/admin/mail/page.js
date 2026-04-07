import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listMailLogsForAdmin } from "../../../lib/auth/store";
import AdminTopNav from "../AdminTopNav";
import AdminMailLogsPanel from "./AdminMailLogsPanel";

export default async function AdminMailPage() {
  await requireRole(["admin"]);
  const result = await listMailLogsForAdmin({ page: 1, pageSize: 40 });

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>メール管理</h1>
        <p className={styles.description}>
          メールテンプレート管理と送信履歴(成功/失敗/再送)を運用者向けに確認します。
        </p>
        <AdminTopNav currentPath="/admin/mail" />
        <AdminMailLogsPanel initialLogs={result.items || []} initialPagination={result.pagination} />
      </main>
    </div>
  );
}


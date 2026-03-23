import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listStudentsForAdmin } from "../../../lib/auth/store";
import AdminStudentsPanel from "../AdminStudentsPanel";
import AdminTopNav from "../AdminTopNav";

export default async function AdminStudentsPage() {
  await requireRole(["admin"]);
  const result = await listStudentsForAdmin({}, { page: 1, pageSize: 20 });

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>学生管理</h1>
        <p className={styles.description}>
          学生番号・名前・連絡先・登録状態を確認し、詳細画面から個別管理できます。
        </p>
        <AdminTopNav currentPath="/admin/students" />
        <AdminStudentsPanel initialStudents={result.items} initialPagination={result.pagination} />
      </main>
    </div>
  );
}


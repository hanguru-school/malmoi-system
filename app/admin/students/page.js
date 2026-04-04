import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listStudentsForAdmin, summarizeStudentRisksForAdmin } from "../../../lib/auth/store";
import { useAdminStudentsUiV2 } from "../../../lib/ui/featureFlags";
import AdminStudentsPanel from "../AdminStudentsPanel";
import AdminStudentsPanelV2 from "../AdminStudentsPanelV2";
import AdminTopNav from "../AdminTopNav";

export default async function AdminStudentsPage({ searchParams }) {
  await requireRole(["admin"]);
  const q = await searchParams;
  const useV2 = useAdminStudentsUiV2(q?.ui);
  const result = await listStudentsForAdmin({}, { page: 1, pageSize: 20 });
  const initialIds = (result.items || []).map((s) => s.id).filter(Boolean);
  const initialRiskByStudentId = await summarizeStudentRisksForAdmin(initialIds);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>学生管理</h1>
        <p className={styles.description}>
          {useV2
            ? "検索・フィルターで絞り込み、詳細画面から個別管理できます。"
            : "学生番号・名前・連絡先・登録状態を確認し、詳細画面から個別管理できます。"}
        </p>
        <AdminTopNav currentPath="/admin/students" />
        {useV2 ? (
          <AdminStudentsPanelV2
            initialStudents={result.items}
            initialPagination={result.pagination}
            initialRiskByStudentId={initialRiskByStudentId}
          />
        ) : (
          <AdminStudentsPanel initialStudents={result.items} initialPagination={result.pagination} />
        )}
      </main>
    </div>
  );
}


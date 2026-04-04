import { Suspense } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import AdminTopNav from "../AdminTopNav";
import AdminHomeworkPanel from "./AdminHomeworkPanel";

export default async function AdminHomeworkPage({ searchParams }) {
  await requireRole(["admin"]);
  const query = await searchParams;
  const initialLessonUnitId = String(query?.lessonUnitId || "").trim();
  const initialStudentId = String(query?.studentId || "").trim();
  const initialLessonDate = String(query?.lessonDate || "").trim();
  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>宿題管理</h1>
        <p className={styles.description}>
          学生別の宿題を作成・公開し、提出状況と確認状況を一画面で管理できます。
        </p>
        <AdminTopNav currentPath="/admin/homework" />
        <Suspense fallback={<p className={styles.description}>読み込み中...</p>}>
          <AdminHomeworkPanel
            initialLessonUnitId={initialLessonUnitId}
            initialStudentId={initialStudentId}
            initialLessonDate={initialLessonDate}
            mode="admin"
          />
        </Suspense>
      </main>
    </div>
  );
}

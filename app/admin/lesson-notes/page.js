import { Suspense } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import AdminLessonNotesPanel from "./AdminLessonNotesPanel";
import AdminTopNav from "../AdminTopNav";

export default async function AdminLessonNotesPage({ searchParams }) {
  await requireRole(["admin"]);
  const query = await searchParams;
  const initialStudentIdFilter = String(query?.studentId || "").trim();
  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>レッスンノート管理</h1>
        <p className={styles.description}>
          lessonUnitId基準でレッスンノートを作成し、対象学生を接続できます。
        </p>
        <AdminTopNav currentPath="/admin/lesson-notes" />
        <Suspense fallback={<p className={styles.description}>読み込み中...</p>}>
          <AdminLessonNotesPanel
            enableUnassignedTeacherFilter
            enableBulkAssignUnassignedTeacher
            initialStudentIdFilter={initialStudentIdFilter}
            scopeNotice={
              initialStudentIdFilter
                ? `学生IDフィルター適用中: ${initialStudentIdFilter} (対象学生のノート中心表示)`
                : ""
            }
          />
        </Suspense>
      </main>
    </div>
  );
}

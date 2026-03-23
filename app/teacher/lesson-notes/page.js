import styles from "../../login/login.module.css";
import { requireRole } from "../../../lib/auth/session";
import AdminLessonNotesPanel from "../../admin/lesson-notes/AdminLessonNotesPanel";
import TeacherTopNav from "../TeacherTopNav";

export default async function TeacherLessonNotesPage() {
  await requireRole(["teacher"]);
  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>レッスンノート管理 (先生)</h1>
        <p className={styles.description}>
          lessonUnitId基準でレッスンノートを作成し、対象学生を接続できます。
        </p>
        <TeacherTopNav currentPath="/teacher/lesson-notes" />
        <AdminLessonNotesPanel
          apiBasePath="/api/teacher/lesson-notes"
          scopeNotice="担当範囲: 自分が作成したレッスンノートのみ表示・修正・削除できます。"
          showOwnerBadge
          ownerBadgeText="作成者: 自分"
        />
      </main>
    </div>
  );
}

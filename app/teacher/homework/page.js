import styles from "../../login/login.module.css";
import { requireRole } from "../../../lib/auth/session";
import AdminHomeworkPanel from "../../admin/homework/AdminHomeworkPanel";
import TeacherTopNav from "../TeacherTopNav";

export default async function TeacherHomeworkPage({ searchParams }) {
  await requireRole(["teacher"]);
  const query = await searchParams;
  const initialLessonUnitId = String(query?.lessonUnitId || "").trim();
  const initialStudentId = String(query?.studentId || "").trim();
  const initialLessonDate = String(query?.lessonDate || "").trim();
  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>宿題管理 (先生)</h1>
        <p className={styles.description}>担当学生の宿題作成・提出確認・完了処理を行えます。</p>
        <TeacherTopNav currentPath="/teacher/homework" />
        <AdminHomeworkPanel
          initialLessonUnitId={initialLessonUnitId}
          initialStudentId={initialStudentId}
          initialLessonDate={initialLessonDate}
          mode="teacher"
        />
      </main>
    </div>
  );
}

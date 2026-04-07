import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import { listStudentsForTeacherOverview } from "../../../../lib/auth/store";
import TeacherTopNav from "../../TeacherTopNav";
import StudentRecentFlowSummary from "../../../admin/students/[id]/StudentRecentFlowSummary";

export default async function TeacherStudentDetailPage({ params }) {
  await requireRole(["teacher"]);
  const { id } = await params;
  const students = await listStudentsForTeacherOverview();
  const student = students.find((s) => s.id === id);
  if (!student) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>学生サマリー</h1>
        <p className={styles.description}>
          {student.studentNumber || "—"} / {student.nameKanji || "—"} / {student.nameFurigana || "—"}
        </p>
        <TeacherTopNav currentPath="/teacher/students" />
        <div className={styles.links} style={{ marginBottom: "0.75rem" }}>
          <Link className={styles.link} href={`/teacher/progress?studentId=${encodeURIComponent(student.id)}`}>
            学習統計
          </Link>
          <Link
            className={styles.link}
            href={`/teacher/lesson-notes?studentId=${encodeURIComponent(student.id)}`}
          >
            レッスンノート
          </Link>
          <Link
            className={styles.link}
            href={`/teacher/homework?studentId=${encodeURIComponent(student.id)}`}
          >
            宿題
          </Link>
          <Link className={styles.link} href="/teacher/students">
            一覧へ戻る
          </Link>
        </div>
        <StudentRecentFlowSummary studentId={student.id} apiRole="teacher" />
      </main>
    </div>
  );
}

import styles from "../login/login.module.css";
import Link from "next/link";
import { requireRole } from "../../lib/auth/session";
import {
  listHomeworksForAdmin,
  listLessonNotesForAdmin,
  listReservationsForAdmin,
  listStudentsForTeacherOverview,
} from "../../lib/auth/store";
import LogoutButton from "../login/next/LogoutButton";
import TeacherTopNav from "./TeacherTopNav";

function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export default async function TeacherHomePage() {
  const session = await requireRole(["teacher"]);
  const today = todayInJst();
  const [reservations, notes, homeworks, students] = await Promise.all([
    listReservationsForAdmin({ page: 1, pageSize: 300, fromDate: today, toDate: today }),
    listLessonNotesForAdmin({ teacherUserId: session.user.id }),
    listHomeworksForAdmin({ teacherUserId: session.user.id }),
    listStudentsForTeacherOverview(),
  ]);

  const todaysLessons = (reservations.items || []).filter(
    (item) => item.instructorUserId === session.user.id && ["requested", "confirmed", "completed"].includes(item.status)
  );
  const completedLessonUnitIds = new Set(
    todaysLessons.filter((item) => item.status === "completed" && item.lessonUnitId).map((item) => item.lessonUnitId)
  );
  const notedLessonUnitIds = new Set(
    (notes || [])
      .filter((item) => item.lessonUnitId)
      .map((item) => item.lessonUnitId)
  );
  const missingNotes = [...completedLessonUnitIds].filter((unitId) => !notedLessonUnitIds.has(unitId)).length;
  const submittedHomeworks = (homeworks || []).filter((item) => item.status === "submitted").length;

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>先生ホーム</h1>
        <p className={styles.description}>今日の授業進行と記録作成を優先して進めてください。</p>
        <TeacherTopNav currentPath="/teacher" />
        <div className={styles.infoCard}>
          <p>今日の担当予約: {todaysLessons.length} 件</p>
          <p>未作成レッスンノート: {missingNotes} 件</p>
          <p>確認が必要な宿題(提出済み): {submittedHomeworks} 件</p>
          <p>担当候補学生数: {students.length} 名</p>
        </div>
        <div className={styles.links}>
          <Link className={styles.link} href="/teacher/lessons">本日のレッスンを見る</Link>
          <Link className={styles.link} href="/teacher/lesson-notes">レッスンノートを作成/確認</Link>
          <Link className={styles.link} href="/teacher/homework">宿題を確認</Link>
          <Link className={styles.link} href="/teacher/students">学生検索・学習統計</Link>
        </div>
        <LogoutButton />
      </main>
    </div>
  );
}

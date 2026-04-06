import Link from "next/link";
import { requireRole } from "../../../lib/auth/session";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentHomeworkPanel from "./StudentHomeworkPanel";
import styles from "../student.module.css";

export default async function StudentHomeworkPage() {
  await requireRole(["student"]);
  return (
    <StudentAreaLayout title="宿題" subtitle="未完了・提出中・最近の完了を分けて表示します。見落としを防ぎましょう。">
      <div className={styles.homeworkFlowBanner}>
        <Link href="/student/lesson-notes#latest-lesson-note">最新のレッスンノート</Link>
        <Link href="/student/lesson-notes">すべてのノート</Link>
        <Link href="/student/reservations">次のレッスン</Link>
      </div>
      <StudentHomeworkPanel />
    </StudentAreaLayout>
  );
}

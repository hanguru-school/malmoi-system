import Link from "next/link";
import { requireRole } from "../../../lib/auth/session";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentHomeworkPanel from "./StudentHomeworkPanel";
import styles from "../student.module.css";

export default async function StudentHomeworkPage() {
  await requireRole(["student"]);
  return (
    <StudentAreaLayout title="宿題" subtitle="宿題の状態がひと目でわかります。終わったらチェックしましょう。">
      <div className={styles.homeworkFlowBanner}>
        <Link href="/student/reservations">次のレッスンを確認</Link>
        <Link href="/student/lesson-notes">レッスンノートへ</Link>
      </div>
      <StudentHomeworkPanel />
    </StudentAreaLayout>
  );
}

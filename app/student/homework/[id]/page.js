import Link from "next/link";
import { notFound } from "next/navigation";
import StudentAreaLayout from "../../StudentAreaLayout";
import { requireRole } from "../../../../lib/auth/session";
import { getHomeworkForStudent } from "../../../../lib/auth/store";
import styles from "../../../login/login.module.css";
import StudentHomeworkDetailClient from "../StudentHomeworkDetailClient";

function typeLabel(type) {
  if (type === "vocabulary") return "単語";
  if (type === "grammar") return "文法";
  if (type === "writing") return "作文";
  if (type === "conversation") return "会話練習";
  if (type === "pronunciation") return "発音練習";
  if (type === "reading") return "読解";
  if (type === "listening") return "聞き取り";
  return "自由課題";
}

function statusLabel(status) {
  if (status === "not_started") return "未完了";
  if (status === "in_progress") return "未完了";
  if (status === "submitted") return "提出済み";
  if (status === "reviewed") return "完了";
  if (status === "completed") return "完了";
  return "-";
}

export default async function StudentHomeworkDetailPage({ params }) {
  const session = await requireRole(["student"]);
  const { id } = await params;
  const item = await getHomeworkForStudent(session.user.id, id);
  if (!item) notFound();

  const done = item.status === "reviewed" || item.status === "completed";

  return (
    <StudentAreaLayout title="宿題" subtitle="課題 → 次のレッスンへ">
      <div className={styles.links} style={{ marginBottom: "0.75rem" }}>
        <Link className={styles.link} href="/student/reservations">
          次のレッスンを確認
        </Link>
        <Link className={styles.link} href="/student/lesson-notes">
          レッスンノートへ
        </Link>
      </div>

      <article
        className={styles.reservationCard}
        style={{
          opacity: done ? 0.85 : 1,
          borderColor: done ? "#e2e8f0" : "#fed7aa",
        }}
      >
        <div className={styles.reservationCardHead}>
          <p className={styles.reservationDate}>{item.title || "-"}</p>
          <p className={styles.reservationTime}>{item.lessonDate || "-"}</p>
          <span
            className={`${styles.reservationStatusBadge} ${
              done ? styles.reservationStatusCompleted : styles.reservationStatusPending
            }`}
          >
            {statusLabel(item.status)}
          </span>
        </div>
        <div className={styles.reservationMeta}>
          <p>
            <strong>種類</strong>: {typeLabel(item.type)}
          </p>
          <p>
            <strong>締切</strong>: {item.dueDate || "なし"}
          </p>
          <p>
            <strong>問題・内容</strong>
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{item.description || "—"}</p>
          {item.teacherMemo ? (
            <p style={{ marginTop: "0.5rem" }}>
              <strong>先生からのメッセージ</strong>
            </p>
          ) : null}
          {item.teacherMemo ? <p style={{ whiteSpace: "pre-wrap" }}>{item.teacherMemo}</p> : null}
          {item.studentMemo ? (
            <>
              <p style={{ marginTop: "0.5rem" }}>
                <strong>自分のメモ</strong>
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>{item.studentMemo}</p>
            </>
          ) : null}
        </div>
      </article>

      <StudentHomeworkDetailClient item={item} />
    </StudentAreaLayout>
  );
}

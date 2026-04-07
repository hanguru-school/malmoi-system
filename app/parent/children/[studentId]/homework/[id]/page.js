import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../../login/login.module.css";
import { requireRole } from "../../../../../../lib/auth/session";
import { getHomeworkForParentChild } from "../../../../../../lib/auth/store";
import ParentTopNav from "../../../../ParentTopNav";

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
  if (status === "not_started") return "未着手";
  if (status === "in_progress") return "取組中";
  if (status === "submitted") return "提出済み";
  if (status === "reviewed") return "確認済み";
  if (status === "completed") return "完了";
  return "-";
}

export default async function ParentChildHomeworkDetailPage({ params }) {
  const session = await requireRole(["parent"]);
  const { studentId, id } = await params;
  const item = await getHomeworkForParentChild(session.user.id, studentId, id);
  if (!item) notFound();
  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>宿題詳細 (保護者)</h1>
        <ParentTopNav currentPath={`/parent/children/${studentId}/homework`} studentId={studentId} />
        <article className={styles.reservationCard}>
          <div className={styles.reservationCardHead}>
            <p className={styles.reservationDate}>{item.title || "-"}</p>
            <p className={styles.reservationTime}>{item.lessonDate || "-"}</p>
            <span className={`${styles.reservationStatusBadge} ${styles.reservationStatusConfirmed}`}>
              {statusLabel(item.status)}
            </span>
          </div>
          <div className={styles.reservationMeta}>
            <p>種類: {typeLabel(item.type)}</p>
            <p>関連レッスン日: {item.lessonDate || "-"}</p>
            <p>締切: {item.dueDate || "なし"}</p>
            <p>内容: {item.description || "-"}</p>
            <p>先生メモ: {item.teacherMemo || "-"}</p>
            <p>生徒メモ: {item.studentMemo || "-"}</p>
          </div>
        </article>
        <div className={styles.links}>
          <Link className={styles.link} href={`/parent/children/${studentId}/homework`}>
            宿題一覧へ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

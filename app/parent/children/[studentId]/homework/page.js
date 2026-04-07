import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../login/login.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getParentChildOverviewForUser, listHomeworksForParentChild } from "../../../../../lib/auth/store";
import ParentTopNav from "../../../ParentTopNav";

function statusLabel(status) {
  if (status === "not_started") return "未着手";
  if (status === "in_progress") return "取組中";
  if (status === "submitted") return "提出済み";
  if (status === "reviewed") return "確認済み";
  if (status === "completed") return "完了";
  return "-";
}

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

export default async function ParentChildHomeworkPage({ params }) {
  const session = await requireRole(["parent"]);
  const { studentId } = await params;
  const data = await getParentChildOverviewForUser(session.user.id, studentId);
  if (!data) notFound();
  const homeworkData = await listHomeworksForParentChild(session.user.id, studentId);
  if (!homeworkData) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>宿題 (保護者)</h1>
        <ParentTopNav
          currentPath={`/parent/children/${studentId}/homework`}
          studentId={studentId}
          permissions={data.link.permissions}
        />
        <article className={styles.reservationCard}>
          <div className={styles.reservationCardHead}>
            <p className={styles.reservationDate}>{data.student.nameKanji || "-"}</p>
            <p className={styles.reservationTime}>{data.student.studentNumber || "-"}</p>
            <span
              className={`${styles.reservationStatusBadge} ${
                data.link.permissions.canViewHomework
                  ? styles.reservationStatusConfirmed
                  : styles.reservationStatusCancelled
              }`}
            >
              {data.link.permissions.canViewHomework ? "閲覧可" : "閲覧不可"}
            </span>
          </div>
          <div className={styles.reservationMeta}>
            <p>メニュー: 宿題</p>
            <p>関係: {data.link.relationship || "保護者"}</p>
          </div>
        </article>
        {!data.link.permissions.canViewHomework ? (
          <p className={styles.message}>宿題情報の閲覧権限がありません。</p>
        ) : (
          <div className={styles.links}>
            {homeworkData.items.map((item) => (
              <article key={item.id} className={styles.reservationCard}>
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
                  <p>先生メモ: {item.teacherMemo || "-"}</p>
                  <p>状態: {statusLabel(item.status)}</p>
                </div>
                <div className={styles.links}>
                  <Link className={styles.link} href={`/parent/children/${studentId}/homework/${item.id}`}>
                    詳細を見る
                  </Link>
                </div>
              </article>
            ))}
            {homeworkData.items.length === 0 ? <p>現在表示できる宿題はありません。</p> : null}
          </div>
        )}
        <div className={styles.links}>
          <Link className={styles.link} href={`/parent/children/${studentId}`}>
            子ども詳細へ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

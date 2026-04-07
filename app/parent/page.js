import Link from "next/link";
import styles from "../login/login.module.css";
import { requireRole } from "../../lib/auth/session";
import { listParentChildrenForUser, listNoticesForStudent } from "../../lib/auth/store";
import ParentTopNav from "./ParentTopNav";

function statusMeta(status) {
  if (status === "requested") return { label: "予約申請中", tone: "pending" };
  if (status === "confirmed") return { label: "予約確定", tone: "confirmed" };
  if (status === "completed") return { label: "完了", tone: "completed" };
  if (status === "cancelled") return { label: "キャンセル", tone: "cancelled" };
  return { label: status || "-", tone: "scheduled" };
}

export default async function ParentHomePage() {
  const session = await requireRole(["parent"]);
  const children = await listParentChildrenForUser(session.user.id);
  const notices = await listNoticesForStudent({ limit: 3 });

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>保護者ホーム</h1>
        <p className={styles.description}>
          連携されたお子様の学習情報を確認できます。
        </p>
        <ParentTopNav currentPath="/parent" />

        <h2 className={styles.sectionTitle}>子ども一覧</h2>
        <div className={styles.links}>
          {children.map((child) => {
            const next = child.nextReservation;
            const status = statusMeta(next?.status);
            const statusClassName =
              status.tone === "pending"
                ? styles.reservationStatusPending
                : status.tone === "confirmed"
                  ? styles.reservationStatusConfirmed
                  : status.tone === "completed"
                    ? styles.reservationStatusCompleted
                    : status.tone === "cancelled"
                      ? styles.reservationStatusCancelled
                      : styles.reservationStatusScheduled;
            return (
              <article key={child.studentId} className={styles.reservationCard}>
                <div className={styles.reservationCardHead}>
                  <p className={styles.reservationDate}>{child.nameKanji || "-"}</p>
                  <p className={styles.reservationTime}>{child.studentNumber || "-"}</p>
                  <span className={`${styles.reservationStatusBadge} ${statusClassName}`}>{status.label}</span>
                </div>
                <div className={styles.reservationMeta}>
                  <p>関係: {child.relationship || "保護者"}</p>
                  <p>
                    次の予約: {next ? `${next.date} ${next.time}` : "なし"}
                  </p>
                </div>
                <Link className={styles.link} href={`/parent/children/${child.studentId}`}>
                  詳細を見る
                </Link>
              </article>
            );
          })}
          {children.length === 0 ? <p>連携された子ども情報がありません。</p> : null}
        </div>

        <h2 className={styles.sectionTitle}>最近のお知らせ</h2>
        <div className={styles.links}>
          {notices.map((notice) => (
            <article key={notice.id} className={styles.noticeSimpleCard}>
              <div className={styles.noticeSimpleHead}>
                <p className={styles.noticeSimpleDate}>
                  {String(notice.publishedAt || notice.updatedAt || "").slice(0, 10) || "-"}
                </p>
                {notice.isImportant ? <span className={styles.noticeSimpleBadge}>重要</span> : null}
              </div>
              <p className={styles.noticeSimpleTitle}>{notice.title}</p>
            </article>
          ))}
          {notices.length === 0 ? <p>表示できるお知らせはありません。</p> : null}
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../login/login.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getParentChildOverviewForUser } from "../../../../../lib/auth/store";
import ParentTopNav from "../../../ParentTopNav";

export default async function ParentChildPointsPage({ params }) {
  const session = await requireRole(["parent"]);
  const { studentId } = await params;
  const data = await getParentChildOverviewForUser(session.user.id, studentId);
  if (!data) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>ポイント/時間 (保護者)</h1>
        <ParentTopNav
          currentPath={`/parent/children/${studentId}/points`}
          studentId={studentId}
          permissions={data.link.permissions}
        />
        <article className={styles.reservationCard}>
          <div className={styles.reservationCardHead}>
            <p className={styles.reservationDate}>{data.student.nameKanji || "-"}</p>
            <p className={styles.reservationTime}>{data.student.studentNumber || "-"}</p>
            <span
              className={`${styles.reservationStatusBadge} ${
                data.link.permissions.canViewPayments
                  ? styles.reservationStatusConfirmed
                  : styles.reservationStatusCancelled
              }`}
            >
              {data.link.permissions.canViewPayments ? "閲覧可" : "閲覧不可"}
            </span>
          </div>
          <div className={styles.reservationMeta}>
            <p>メニュー: ポイント/時間</p>
            <p>関係: {data.link.relationship || "保護者"}</p>
          </div>
        </article>
        {!data.link.permissions.canViewPayments ? (
          <p className={styles.message}>支払い/ポイント情報の閲覧権限がありません。</p>
        ) : (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>残り時間</p>
                <p className={styles.summaryValue}>{data.student.lessonMinutes?.remainingMinutes ?? 0}分</p>
              </article>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>総時間</p>
                <p className={styles.summaryValue}>{data.student.lessonMinutes?.totalMinutes ?? 0}分</p>
              </article>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>使用済み時間</p>
                <p className={styles.summaryValue}>{data.student.lessonMinutes?.usedMinutes ?? 0}分</p>
              </article>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>ポイント</p>
                <p className={styles.summaryValue}>{data.student.points?.balance ?? 0}pt</p>
              </article>
            </div>
            <section className={styles.noticeCard}>
              <h2 className={styles.sectionTitle}>最近の時間履歴</h2>
              <ul className={styles.noticeList}>
                {(data.lessonMinuteLogs || []).map((log) => (
                  <li key={log.id}>
                    {String(log.at || "").slice(0, 16)} / {log.reason || "-"} / {log.deltaMinutes > 0 ? "+" : ""}
                    {Number(log.deltaMinutes || 0)}分
                  </li>
                ))}
                {(data.lessonMinuteLogs || []).length === 0 ? <li>履歴がありません。</li> : null}
              </ul>
            </section>
          </>
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

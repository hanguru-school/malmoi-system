import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../login/login.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getParentChildOverviewForUser } from "../../../../../lib/auth/store";
import ParentTopNav from "../../../ParentTopNav";

function statusLabel(status) {
  if (status === "requested") return { label: "予約申請中", tone: "pending" };
  if (status === "confirmed") return { label: "予約確定", tone: "confirmed" };
  if (status === "cancelled") return { label: "キャンセル", tone: "cancelled" };
  if (status === "completed") return { label: "完了", tone: "completed" };
  return { label: status || "-", tone: "scheduled" };
}

export default async function ParentChildReservationsPage({ params }) {
  const session = await requireRole(["parent"]);
  const { studentId } = await params;
  const data = await getParentChildOverviewForUser(session.user.id, studentId);
  if (!data) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>予約一覧 (保護者)</h1>
        <p className={styles.description}>
          {data.student.nameKanji || "-"} ({data.student.studentNumber || "-"})
        </p>
        <ParentTopNav
          currentPath={`/parent/children/${studentId}/reservations`}
          studentId={studentId}
          permissions={data.link.permissions}
        />
        {!data.link.permissions.canViewReservations ? (
          <p className={styles.message}>予約情報の閲覧権限がありません。</p>
        ) : (
          <div className={styles.links}>
            {data.reservations.map((item) => {
              const status = statusLabel(item.status);
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
                <article key={item.id} className={styles.reservationCard}>
                  <div className={styles.reservationCardHead}>
                    <p className={styles.reservationDate}>{item.date || "-"}</p>
                    <p className={styles.reservationTime}>{item.time || "-"}</p>
                    <span className={`${styles.reservationStatusBadge} ${statusClassName}`}>{status.label}</span>
                  </div>
                  <div className={styles.reservationMeta}>
                    <p>授業タイプ: {item.lessonDeliveryType === "online" ? "オンライン" : "対面"}</p>
                    <p>担当講師: {item.instructorName || "-"}</p>
                    <p>時間: {item.durationMinutes}分</p>
                  </div>
                </article>
              );
            })}
            {data.reservations.length === 0 ? <p>表示できる予約がありません。</p> : null}
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

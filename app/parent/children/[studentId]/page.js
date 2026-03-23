import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import { getParentChildOverviewForUser } from "../../../../lib/auth/store";
import ParentTopNav from "../../ParentTopNav";

function statusLabel(status) {
  if (status === "requested") return "予約申請中";
  if (status === "confirmed") return "予約確定";
  if (status === "cancelled") return "キャンセル";
  if (status === "completed") return "完了";
  return status || "-";
}

export default async function ParentChildDetailPage({ params }) {
  const session = await requireRole(["parent"]);
  const { studentId } = await params;
  const data = await getParentChildOverviewForUser(session.user.id, studentId);
  if (!data) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>子ども情報</h1>
        <p className={styles.description}>
          {data.student.nameKanji || "-"} ({data.student.studentNumber || "-"})
        </p>
        <ParentTopNav currentPath={`/parent/children/${studentId}`} studentId={studentId} permissions={data.link.permissions} />
        <p className={styles.description}>関係: {data.link.relationship || "保護者"}</p>
        <div className={styles.infoCard}>
          <p>閲覧権限</p>
          <p>予約: {data.link.permissions.canViewReservations ? "可" : "不可"}</p>
          <p>レッスンノート: {data.link.permissions.canViewLessonNotes ? "可" : "不可"}</p>
          <p>宿題: {data.link.permissions.canViewHomework ? "可" : "不可"}</p>
          <p>支払い/ポイント: {data.link.permissions.canViewPayments ? "可" : "不可"}</p>
        </div>
        <section className={styles.linkSection}>
          <h3 className={styles.linkSectionTitle}>子どもメニュー</h3>
          <div className={styles.linkGrid}>
            {data.link.permissions.canViewReservations ? (
              <Link className={styles.linkButton} href={`/parent/children/${data.student.id}/reservations`}>
                予約を見る
              </Link>
            ) : null}
            <Link className={styles.linkButton} href={`/parent/children/${data.student.id}/notices`}>
              お知らせを見る
            </Link>
            {data.link.permissions.canViewLessonNotes ? (
              <Link className={styles.linkButton} href={`/parent/children/${data.student.id}/lesson-notes`}>
                レッスンノート
              </Link>
            ) : null}
            {(data.link.permissions.canViewReservations || data.link.permissions.canViewLessonNotes) ? (
              <Link className={styles.linkButton} href={`/parent/children/${data.student.id}/progress`}>
                学習状況
              </Link>
            ) : null}
            {data.link.permissions.canViewHomework ? (
              <Link className={styles.linkButton} href={`/parent/children/${data.student.id}/homework`}>
                宿題
              </Link>
            ) : null}
            {data.link.permissions.canViewPayments ? (
              <Link className={styles.linkButton} href={`/parent/children/${data.student.id}/points`}>
                ポイント/時間
              </Link>
            ) : null}
          </div>
        </section>

        <h2 className={styles.sectionTitle}>予約 (読み取り専用)</h2>
        <div className={styles.links}>
          {data.link.permissions.canViewReservations ? (
            <>
              {data.reservations.map((item) => (
                <article key={item.id} className={styles.infoCard}>
                  <p>
                    {item.date} {item.time} / {item.durationMinutes}分
                  </p>
                  <p>授業タイプ: {item.lessonDeliveryType === "online" ? "オンライン" : "対面"}</p>
                  <p>担当講師: {item.instructorName || "-"}</p>
                  <p>状態: {statusLabel(item.status)}</p>
                </article>
              ))}
              {data.reservations.length === 0 ? <p>表示できる予約がありません。</p> : null}
            </>
          ) : (
            <p>予約情報の閲覧権限がありません。</p>
          )}
        </div>

        <h2 className={styles.sectionTitle}>お知らせ</h2>
        <div className={styles.links}>
          {data.notices.map((notice) => (
            <article key={notice.id} className={styles.infoCard}>
              <p>{notice.title}</p>
              <p>{notice.summary || "-"}</p>
              <p>{String(notice.publishedAt || "").slice(0, 10) || "-"}</p>
            </article>
          ))}
          {data.notices.length === 0 ? <p>表示できるお知らせがありません。</p> : null}
        </div>

        <h2 className={styles.sectionTitle}>レッスンノート / 宿題 / 支払い</h2>
        <div className={styles.links}>
          <article className={styles.infoCard}>
            <p>レッスンノート: {data.link.permissions.canViewLessonNotes ? "閲覧可能" : "閲覧不可"}</p>
          </article>
          <article className={styles.infoCard}>
            <p>宿題: {data.link.permissions.canViewHomework ? "閲覧可能" : "閲覧不可"}</p>
          </article>
          <article className={styles.infoCard}>
            <p>支払い/ポイント: {data.link.permissions.canViewPayments ? "今後表示予定" : "閲覧不可"}</p>
          </article>
        </div>

        <div className={styles.links}>
          <Link className={styles.link} href="/parent">
            保護者ホームへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

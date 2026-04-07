import Link from "next/link";
import { requireRole } from "../../../lib/auth/session";
import { listNoticesForStudent } from "../../../lib/auth/store";
import StudentAreaLayout from "../StudentAreaLayout";
import styles from "../student.module.css";

function toSummaryText(notice) {
  const summary = String(notice?.summary || "").trim();
  if (summary) return summary;
  const raw = String(notice?.content || "").trim();
  if (!raw) return "";
  return raw.length > 80 ? `${raw.slice(0, 80)}...` : raw;
}

export default async function StudentNoticesPage() {
  await requireRole(["student"]);
  const notices = await listNoticesForStudent({ limit: 20 });

  return (
    <StudentAreaLayout title="お知らせ" subtitle="教室からのお知らせを一覧で確認できます。">
      <section className={styles.noticeCardStack}>
        {notices.length > 0 ? (
          notices.map((notice) => (
            <article key={notice.id} className={styles.noticeItemCard}>
              <div className={styles.noticeItemHead}>
                <p className={styles.noticeItemDate}>
                  {String(notice.publishedAt || notice.updatedAt || "").slice(0, 10) || "-"}
                </p>
                {notice.isImportant ? <span className={styles.noticeImportantBadge}>重要</span> : null}
              </div>
              <Link className={styles.noticeItemTitle} href={`/student/notices/${notice.id}`}>
                {notice.title}
              </Link>
              <p className={styles.noticeItemSummary}>{toSummaryText(notice)}</p>
            </article>
          ))
        ) : (
          <p>現在表示できるお知らせはありません。</p>
        )}
      </section>
    </StudentAreaLayout>
  );
}

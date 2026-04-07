import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../login/login.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getParentChildOverviewForUser } from "../../../../../lib/auth/store";
import ParentTopNav from "../../../ParentTopNav";

export default async function ParentChildNoticesPage({ params }) {
  const session = await requireRole(["parent"]);
  const { studentId } = await params;
  const data = await getParentChildOverviewForUser(session.user.id, studentId);
  if (!data) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>お知らせ (保護者)</h1>
        <p className={styles.description}>
          {data.student.nameKanji || "-"} ({data.student.studentNumber || "-"})
        </p>
        <ParentTopNav
          currentPath={`/parent/children/${studentId}/notices`}
          studentId={studentId}
          permissions={data.link.permissions}
        />
        <div className={styles.links}>
          {data.notices.map((notice) => (
            <article key={notice.id} className={styles.noticeSimpleCard}>
              <div className={styles.noticeSimpleHead}>
                <p className={styles.noticeSimpleDate}>{String(notice.publishedAt || "").slice(0, 10) || "-"}</p>
                {notice.isImportant ? <span className={styles.noticeSimpleBadge}>重要</span> : null}
              </div>
              <p className={styles.noticeSimpleTitle}>{notice.title}</p>
              <p className={styles.noticeSimpleSummary}>{notice.summary || "-"}</p>
            </article>
          ))}
          {data.notices.length === 0 ? <p>表示できるお知らせがありません。</p> : null}
        </div>
        <div className={styles.links}>
          <Link className={styles.link} href={`/parent/children/${studentId}`}>
            子ども詳細へ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

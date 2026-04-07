import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "../../student.module.css";
import { requireRole } from "../../../../lib/auth/session";
import { getNoticeByIdForStudent } from "../../../../lib/auth/store";
import StudentAreaLayout from "../../StudentAreaLayout";

export default async function StudentNoticeDetailPage({ params }) {
  await requireRole(["student"]);
  const { id } = await params;
  const notice = await getNoticeByIdForStudent(id);
  if (!notice) notFound();

  return (
    <StudentAreaLayout title="お知らせ詳細" subtitle="内容を確認できます。">
      <section className={styles.noticeDetailCard}>
        <h1 className={styles.sectionTitle}>{notice.title}</h1>
        {notice.isImportant ? <span className={styles.noticeImportantBadge}>重要</span> : null}
        <p className={styles.noticeItemDate}>
          投稿日時: {String(notice.publishedAt || notice.updatedAt || "").slice(0, 16).replace("T", " ")}
        </p>
        {notice.summary ? <p className={styles.noticeItemSummary}>{notice.summary}</p> : null}
        <div className={styles.noticeBody}>{notice.content || "-"}</div>
        <div className={styles.noticeActions}>
          <Link className={styles.inlineLink} href="/student/notices">お知らせ一覧へ戻る</Link>
        </div>
      </section>
    </StudentAreaLayout>
  );
}

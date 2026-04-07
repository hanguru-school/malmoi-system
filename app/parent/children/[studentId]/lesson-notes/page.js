import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../login/login.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getParentChildOverviewForUser, listLessonNotesForParentChild } from "../../../../../lib/auth/store";
import ParentTopNav from "../../../ParentTopNav";

export default async function ParentChildLessonNotesPage({ params }) {
  const session = await requireRole(["parent"]);
  const { studentId } = await params;
  const data = await getParentChildOverviewForUser(session.user.id, studentId);
  const lessonNotes = await listLessonNotesForParentChild(session.user.id, studentId);
  if (!data) notFound();
  if (!lessonNotes) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>レッスンノート (保護者)</h1>
        <ParentTopNav
          currentPath={`/parent/children/${studentId}/lesson-notes`}
          studentId={studentId}
          permissions={data.link.permissions}
        />
        <article className={styles.reservationCard}>
          <div className={styles.reservationCardHead}>
            <p className={styles.reservationDate}>{data.student.nameKanji || "-"}</p>
            <p className={styles.reservationTime}>{data.student.studentNumber || "-"}</p>
            <span
              className={`${styles.reservationStatusBadge} ${
                data.link.permissions.canViewLessonNotes
                  ? styles.reservationStatusConfirmed
                  : styles.reservationStatusCancelled
              }`}
            >
              {data.link.permissions.canViewLessonNotes ? "閲覧可" : "閲覧不可"}
            </span>
          </div>
          <div className={styles.reservationMeta}>
            <p>メニュー: レッスンノート</p>
            <p>関係: {data.link.relationship || "保護者"}</p>
          </div>
        </article>

        {!lessonNotes.canView ? (
          <p className={styles.message}>レッスンノートの閲覧権限がありません。</p>
        ) : (
          <div className={styles.links}>
            {lessonNotes.items.map((note) => (
              <article key={note.id} className={styles.noticeSimpleCard}>
                <div className={styles.noticeSimpleHead}>
                  <p className={styles.noticeSimpleDate}>{note.date || String(note.updatedAt || "").slice(0, 10) || "-"}</p>
                  <span className={styles.noticeSimpleBadge}>ノート</span>
                </div>
                <p className={styles.noticeSimpleTitle}>{note.title}</p>
                <p className={styles.noticeSimpleSummary}>{note.summary || "-"}</p>
                {note.homeworkSummary ? <p className={styles.noticeSimpleSummary}>宿題: {note.homeworkSummary}</p> : null}
                {note.nextLessonPlan ? <p className={styles.noticeSimpleSummary}>次回: {note.nextLessonPlan}</p> : null}
              </article>
            ))}
            {lessonNotes.items.length === 0 ? (
              <article className={styles.noticeSimpleCard}>
                <p className={styles.noticeSimpleTitle}>レッスンノートはまだありません。</p>
                <p className={styles.noticeSimpleSummary}>公開されたノートがある場合、この画面に表示されます。</p>
              </article>
            ) : null}
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

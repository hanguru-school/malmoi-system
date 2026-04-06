import Link from "next/link";
import { requireRole } from "../../../lib/auth/session";
import { listLessonNotesForStudent } from "../../../lib/auth/store";
import StudentAreaLayout from "../StudentAreaLayout";
import styles from "../student.module.css";
import LessonNoteAudio from "./LessonNoteAudio";

function firstKeyPhrase(note) {
  if (String(note.homeworkSummary || "").trim()) return "";
  const c = String(note.content || "").trim();
  if (!c) return "";
  const line = c.split(/\n/)[0];
  return line.length > 160 ? `${line.slice(0, 160)}…` : line;
}

export default async function StudentLessonNotesPage() {
  const session = await requireRole(["student"]);
  const notes = await listLessonNotesForStudent(session.user.id);

  return (
    <StudentAreaLayout title="レッスンノート" subtitle="最新ノートへジャンプするか、下の一覧で全体を確認できます。">
      <div className={styles.lessonNotesPageActions}>
        {notes[0] ? (
          <Link className={styles.lessonNotesFlowBtn} href="#latest-lesson-note">
            最新のノートへ
          </Link>
        ) : null}
        <Link className={`${styles.lessonNotesFlowBtn} ${styles.lessonNotesFlowBtnSecondary}`} href="#all-lesson-notes">
          一覧へ
        </Link>
        <Link className={`${styles.lessonNotesFlowBtn} ${styles.lessonNotesFlowBtnSecondary}`} href="/student/homework">
          宿題へ
        </Link>
        <Link className={`${styles.lessonNotesFlowBtn} ${styles.lessonNotesFlowBtnSecondary}`} href="/student/reservations">
          次のレッスン
        </Link>
      </div>

      <section id="all-lesson-notes" className={styles.noticeCardStack}>
        {notes.length > 0 ? <div id="latest-lesson-note" style={{ scrollMarginTop: "5rem" }} /> : null}
        {notes.map((note) => (
          <article key={note.id} id={`note-${note.id}`} className={styles.noticeItemCard}>
            <div className={styles.noticeItemHead}>
              <p className={styles.noticeItemDate}>{note.date || String(note.updatedAt || "").slice(0, 10) || "-"}</p>
              {note.hasAudio ? (
                <span className={styles.noticeImportantBadge} style={{ borderColor: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" }}>
                  音声あり
                </span>
              ) : (
                <span className={styles.noticeItemDate} style={{ margin: 0 }}>
                  音声なし
                </span>
              )}
            </div>
            <p className={styles.noticeItemTitle}>{note.title || "レッスンノート"}</p>

            <p className={styles.noteSectionLabel}>学習内容の要約</p>
            <p className={styles.noticeItemSummary}>{note.summary || "—"}</p>

            {firstKeyPhrase(note) ? (
              <>
                <p className={styles.noteSectionLabel}>重要表現・ポイント</p>
                <p className={styles.noteKeyPhrase}>{firstKeyPhrase(note)}</p>
              </>
            ) : null}

            <LessonNoteAudio content={note.content} summary={note.summary} />

            {note.homeworkSummary ? (
              <>
                <p className={styles.noteSectionLabel}>宿題</p>
                <p className={styles.noticeItemSummary}>{note.homeworkSummary}</p>
              </>
            ) : null}
            {note.nextLessonPlan ? (
              <>
                <p className={styles.noteSectionLabel}>次回の予定</p>
                <p className={styles.noticeItemSummary}>{note.nextLessonPlan}</p>
              </>
            ) : null}

            <div className={styles.lessonNotesPageActions} style={{ marginTop: "0.85rem", marginBottom: 0 }}>
              <Link className={styles.lessonNotesFlowBtn} href="/student/homework">
                宿題を見る
              </Link>
            </div>
          </article>
        ))}
        {notes.length === 0 ? (
          <article className={styles.noticeItemCard}>
            <p className={styles.noticeItemTitle}>まだ公開されたレッスンノートがありません。</p>
            <p className={styles.noticeItemSummary}>先生が公開したノートがここに表示されます。</p>
          </article>
        ) : null}
      </section>
    </StudentAreaLayout>
  );
}

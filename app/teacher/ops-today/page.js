import Link from "next/link";
import { requireRole } from "../../../lib/auth/session";
import {
  listHomeworksForAdmin,
  listLessonNotesForAdmin,
  listReservationsForAdmin,
} from "../../../lib/auth/store";
import SubmittedHomeworkBulkBar from "../../components/ops/SubmittedHomeworkBulkBar";
import OpsFlowQueueBootstrap from "../../components/ops/OpsFlowQueueBootstrap";
import OpsTodayProgressHeader from "../../components/ops/OpsTodayProgressHeader";
import TeacherTopNav from "../TeacherTopNav";
import { buildTeacherTodayBacklog, todayYmdJst } from "../../../lib/ops/todayBacklog";
import t from "../teacher.module.css";

export default async function TeacherOpsTodayPage() {
  const session = await requireRole(["teacher"]);
  const today = todayYmdJst();
  const teacherUserId = session.user.id;

  const [resToday, notes, homeworks, resWide] = await Promise.all([
    listReservationsForAdmin({ page: 1, pageSize: 400, fromDate: today, toDate: today }),
    listLessonNotesForAdmin({ teacherUserId }),
    listHomeworksForAdmin({ teacherUserId }),
    listReservationsForAdmin({ page: 1, pageSize: 500 }),
  ]);

  const reservationsToday = resToday.items || [];
  const changePending = (resWide.items || []).filter(
    (r) => String(r.status) === "change_requested" && String(r.instructorUserId || "") === String(teacherUserId)
  );

  const backlog = buildTeacherTodayBacklog({
    todayYmd: today,
    teacherUserId,
    reservationsToday,
    allNotesTeacher: notes || [],
    homeworksTeacher: homeworks || [],
    reservationsChangePending: changePending,
  });

  const bulkItems = backlog.submittedQueue.map((x) => ({ id: x.id, label: x.label }));

  const queueUrls = [
    ...backlog.missingNotes.map((r) => r.href),
    ...backlog.missingHomework.map((r) => r.href),
    ...backlog.submittedQueue.map((r) => r.href),
    ...backlog.reservationQueue.map((r) => r.href),
  ];

  const remainingTotal =
    backlog.missingNotes.length +
    backlog.missingHomework.length +
    backlog.submittedQueue.length +
    backlog.reservationQueue.length;

  return (
    <div className={t.shell}>
      <main className={t.main}>
        <h1 className={t.title}>本日の未処理</h1>
        <p className={t.subtitle}>今日締め切りの記録・確認をここから進めます。各行から処理画面へ移動できます。</p>
        <OpsTodayProgressHeader dateYmd={today} role="teacher" remaining={remainingTotal} className={t.opsProgress} />
        <TeacherTopNav currentPath="/teacher/ops-today" />
        <OpsFlowQueueBootstrap urls={queueUrls} role="teacher" />

        <div className={t.opsIntro}>
          <Link className={t.todayCardLink} href="/teacher">
            ホームへ戻る
          </Link>
        </div>

        <section className={t.opsSection}>
          <h2 className={t.opsSectionTitle}>本日完了・レッスンノート未作成</h2>
          {backlog.missingNotes.length > 0 ? (
            <ul className={t.opsList}>
              {backlog.missingNotes.map((row) => (
                <li key={row.id}>
                  <Link href={row.href}>
                    {row.time} / {row.studentName} / ノート未作成
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={t.opsEmpty}>該当なし</p>
          )}
        </section>

        <section className={t.opsSection}>
          <h2 className={t.opsSectionTitle}>本日完了・宿題未登録</h2>
          {backlog.missingHomework.length > 0 ? (
            <ul className={t.opsList}>
              {backlog.missingHomework.map((row) => (
                <li key={row.id}>
                  <Link href={row.href}>
                    {row.time} / {row.studentName} / 宿題未登録
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={t.opsEmpty}>該当なし</p>
          )}
        </section>

        <section className={t.opsSection}>
          <h2 className={t.opsSectionTitle}>提出確認待ちの宿題</h2>
          {backlog.submittedQueue.length > 0 ? (
            <>
              <ul className={t.opsList}>
                {backlog.submittedQueue.map((row) => (
                  <li key={row.id}>
                    <Link href={row.href}>{row.label}</Link>
                  </li>
                ))}
              </ul>
              <SubmittedHomeworkBulkBar items={bulkItems} />
            </>
          ) : (
            <p className={t.opsEmpty}>該当なし</p>
          )}
        </section>

        <section className={t.opsSection}>
          <h2 className={t.opsSectionTitle}>予約・対応待ち（変更依頼）</h2>
          {backlog.reservationQueue.length > 0 ? (
            <ul className={t.opsList}>
              {backlog.reservationQueue.map((row) => (
                <li key={row.id}>
                  <Link href={row.href}>{row.label}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={t.opsEmpty}>該当なし</p>
          )}
        </section>

        <p className={t.opsFootnote}>
          一括更新は提出済み宿題の「確認済み」へのみ対応します（既存API）。
        </p>
      </main>
    </div>
  );
}

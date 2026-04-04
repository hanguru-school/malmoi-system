import Link from "next/link";
import { requireRole } from "../../../lib/auth/session";
import {
  listHomeworksForAdmin,
  listLessonNotesForAdmin,
  listReservationsForAdmin,
} from "../../../lib/auth/store";
import SubmittedHomeworkBulkBar from "../../components/ops/SubmittedHomeworkBulkBar";
import AdminTopNav from "../AdminTopNav";
import { buildAdminTodayBacklog, todayYmdJst } from "../../../lib/ops/todayBacklog";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";

export default async function AdminOpsTodayPage() {
  await requireRole(["admin"]);
  const today = todayYmdJst();

  const [resToday, allNotes, allHomeworks, pendingRes, changeRes] = await Promise.all([
    listReservationsForAdmin({ page: 1, pageSize: 800, fromDate: today, toDate: today }),
    listLessonNotesForAdmin({}),
    listHomeworksForAdmin({}),
    listReservationsForAdmin({ page: 1, pageSize: 800, status: "requested" }),
    listReservationsForAdmin({ page: 1, pageSize: 800, status: "change_requested" }),
  ]);

  const backlog = buildAdminTodayBacklog({
    todayYmd: today,
    reservationsToday: resToday.items || [],
    allNotes: allNotes || [],
    allHomeworks: allHomeworks || [],
    reservationsPendingApproval: pendingRes.items || [],
    reservationsChangeRequested: changeRes.items || [],
  });

  const bulkItems = backlog.submittedQueue.map((x) => ({ id: x.id, label: x.label }));

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>本日の未処理</h1>
        <p className={styles.description}>
          本日分の抜け・提出確認待ち・予約対応を一覧します。各行から該当画面へ移動できます。
        </p>
        <AdminTopNav currentPath="/admin/ops-today" />

        <div className={adminStyles.opsTodayIntro}>
          <Link className={adminStyles.opsSummaryLink} href="/admin">
            ダッシュボードへ戻る
          </Link>
        </div>

        <section className={adminStyles.opsTodaySection}>
          <h2 className={adminStyles.opsTodaySectionTitle}>本日完了・レッスンノート未作成</h2>
          {backlog.missingNotes.length > 0 ? (
            <ul className={adminStyles.opsTodayList}>
              {backlog.missingNotes.map((row) => (
                <li key={row.id}>
                  <Link href={row.href}>
                    {row.time} / {row.studentName} / ノート未作成
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={adminStyles.opsTodayEmpty}>該当なし</p>
          )}
        </section>

        <section className={adminStyles.opsTodaySection}>
          <h2 className={adminStyles.opsTodaySectionTitle}>本日完了・宿題未登録</h2>
          {backlog.missingHomework.length > 0 ? (
            <ul className={adminStyles.opsTodayList}>
              {backlog.missingHomework.map((row) => (
                <li key={row.id}>
                  <Link href={row.href}>
                    {row.time} / {row.studentName} / 宿題未登録
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={adminStyles.opsTodayEmpty}>該当なし</p>
          )}
        </section>

        <section className={adminStyles.opsTodaySection}>
          <h2 className={adminStyles.opsTodaySectionTitle}>提出確認待ちの宿題</h2>
          {backlog.submittedQueue.length > 0 ? (
            <>
              <ul className={adminStyles.opsTodayList}>
                {backlog.submittedQueue.map((row) => (
                  <li key={row.id}>
                    <Link href={row.href}>{row.label}</Link>
                  </li>
                ))}
              </ul>
              <SubmittedHomeworkBulkBar items={bulkItems} />
            </>
          ) : (
            <p className={adminStyles.opsTodayEmpty}>該当なし</p>
          )}
        </section>

        <section className={adminStyles.opsTodaySection}>
          <h2 className={adminStyles.opsTodaySectionTitle}>承認待ちの予約</h2>
          {backlog.requested.length > 0 ? (
            <ul className={adminStyles.opsTodayList}>
              {backlog.requested.map((row) => (
                <li key={row.id}>
                  <Link href={row.href}>{row.label}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={adminStyles.opsTodayEmpty}>該当なし</p>
          )}
        </section>

        <section className={adminStyles.opsTodaySection}>
          <h2 className={adminStyles.opsTodaySectionTitle}>変更依頼の予約</h2>
          {backlog.changeReq.length > 0 ? (
            <ul className={adminStyles.opsTodayList}>
              {backlog.changeReq.map((row) => (
                <li key={row.id}>
                  <Link href={row.href}>{row.label}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={adminStyles.opsTodayEmpty}>該当なし</p>
          )}
        </section>

        <p className={adminStyles.opsTodayFootnote}>
          一括更新は提出済み宿題の「確認済み」へのみ対応します（既存API）。
        </p>
      </main>
    </div>
  );
}

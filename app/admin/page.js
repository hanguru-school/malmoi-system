import Link from "next/link";
import { requireRole } from "../../lib/auth/session";
import {
  listAuditLogsForAdmin,
  listLessonNotesForAdmin,
  listNoticesForAdmin,
  listMailLogsForAdmin,
  listReservationsForAdmin,
  listStudentsForAdmin,
  getSalesDashboardForAdmin,
} from "../../lib/auth/store";
import AdminTopNav from "./AdminTopNav";
import dashboardStyles from "./admin.module.css";
import AdminPendingApprovalPanel from "./AdminPendingApprovalPanel";

function todayJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

function monthStartJst() {
  const t = todayJst();
  const [y, m] = t.split("-");
  return `${y}-${m}-01`;
}

function fmtYen(n) {
  return `${new Intl.NumberFormat("ja-JP").format(Math.round(Number(n) || 0))}円`;
}

function sortTxDesc(a, b) {
  return String(b.paidAt || "").localeCompare(String(a.paidAt || ""));
}

function reservationStatusLabel(status) {
  const value = String(status || "").trim();
  const map = {
    requested: "承認待ち",
    confirmed: "承認済み",
    change_requested: "変更対応中",
    rejected: "却下",
    cancelled: "キャンセル",
    completed: "完了",
  };
  return map[value] || "不明";
}

function reservationTone(status) {
  const value = String(status || "").trim();
  if (value === "requested") return "pending";
  if (value === "confirmed" || value === "completed") return "good";
  if (value === "cancelled" || value === "rejected") return "bad";
  return "normal";
}

function studentRegistrationLabel(status, consentStatus) {
  const key = String(status || "").trim();
  if (key === "completed") return "登録完了";
  if (String(consentStatus || "").trim() === "pending") return "同意待ち";
  if (key.includes("profile")) return "プロフィール入力待ち";
  return "登録手続き中";
}

function mailTypeLabel(type) {
  const value = String(type || "").trim();
  const map = {
    student_registration_verify: "登録確認メール",
    auth_login_link: "ログインリンク",
    password_reset: "パスワード再設定",
    reservation_created: "予約作成通知",
    reservation_updated: "予約変更通知",
    lesson_note_published: "レッスンノート通知",
    homework_assigned: "宿題通知",
    notice_published: "お知らせ通知",
    payment_completed: "決済完了（学生）",
    payment_completed_office: "決済完了（教室）",
  };
  return map[value] || "メール通知";
}

function mailStatusLabel(status) {
  const value = String(status || "").trim();
  const map = {
    sent: "送信成功",
    failed: "送信失敗",
    retry_target: "再送対象",
    logged: "ログ保存",
    disabled: "無効",
  };
  return map[value] || "処理中";
}

function adminActionLabel(action, summary) {
  const value = String(action || "").trim();
  const map = {
    "reservation.admin_updated": "予約情報を管理者が更新",
    "reservation.admin_cancelled": "予約を管理者がキャンセル",
    "reservation.admin_rejected": "予約を管理者が却下",
    "reservation.admin_change_requested": "予約に変更依頼を送信",
    "reservation.admin_attendance_marked": "出欠状態を更新",
    "student.registration_started": "学生登録を開始",
    "auth.password_reset_requested": "パスワード再設定依頼",
    "auth.password_reset_completed": "パスワード再設定完了",
    "payment.transaction_created": "決済を登録",
    "payment.mails_resent": "決済通知メールを再送",
  };
  return map[value] || String(summary || "管理操作を実行");
}

export default async function AdminPage() {
  await requireRole(["admin"]);
  const today = todayJst();
  const monthStart = monthStartJst();

  const [todayDash, monthDash, allDash, students, reservations, lessonNotes, notices, auditLogs, mailLogs] =
    await Promise.all([
      getSalesDashboardForAdmin({ fromDate: today, toDate: today }),
      getSalesDashboardForAdmin({ fromDate: monthStart, toDate: today }),
      getSalesDashboardForAdmin({}),
      listStudentsForAdmin({}, { page: 1, pageSize: 10 }),
      listReservationsForAdmin({ page: 1, pageSize: 100 }),
      listLessonNotesForAdmin({}),
      listNoticesForAdmin(),
      listAuditLogsForAdmin({ page: 1, pageSize: 8 }),
      listMailLogsForAdmin({ page: 1, pageSize: 30 }),
    ]);

  const sumToday = todayDash.sum || {};
  const sumMonth = monthDash.sum || {};
  const recent = [...(allDash.transactions || [])].sort(sortTxDesc).slice(0, 8);

  const todaysReservations = (reservations.items || [])
    .filter((item) => String(item.date || "") === today)
    .sort((a, b) => `${a.time || ""}`.localeCompare(`${b.time || ""}`));
  const todayTimes = todaysReservations.map((item) => String(item.time || "")).filter(Boolean).sort();
  const firstLesson = todayTimes[0] || "-";
  const lastLesson = todayTimes[todayTimes.length - 1] || "-";

  const pendingStudents = (students.items || []).filter((item) => item.registrationStatus !== "completed").length;
  const pendingApprovalReservations = (reservations.items || []).filter((item) => item.status === "requested").length;
  const unhandledReservations = (reservations.items || []).filter((item) =>
    ["requested", "change_requested", "scheduled"].includes(item.status),
  ).length;
  const completedUnits = new Set(
    (reservations.items || [])
      .filter((item) => item.status === "completed" && item.lessonUnitId)
      .map((item) => item.lessonUnitId),
  );
  const notedUnits = new Set((lessonNotes || []).map((item) => item.lessonUnitId).filter(Boolean));
  const missingLessonNotes = [...completedUnits].filter((unitId) => !notedUnits.has(unitId)).length;
  const unpublishedNotices = (notices || []).filter((item) => !item.isActive).length;

  const recentStudents = (students.items || []).slice(0, 5);
  const recentReservations = (reservations.items || []).slice(0, 5);
  const recentNotes = (lessonNotes || []).slice(0, 5);
  const recentLogs = (auditLogs.items || []).slice(0, 5);
  const recentMails = (mailLogs.items || []).slice(0, 5);
  const failedMails = (mailLogs.items || []).filter((item) => item.status === "failed").length;
  const retryMails = (mailLogs.items || []).filter((item) => item.status === "failed" || item.status === "retry_target").length;
  const pendingApprovalItems = (reservations.items || [])
    .filter((item) => item.status === "requested")
    .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`))
    .slice(0, 6);

  return (
    <div className={dashboardStyles.adminShell}>
      <main className={dashboardStyles.adminCard}>
        <AdminTopNav currentPath="/admin" showPageTitle pageTitle="管理ダッシュボード" />
        <p className={dashboardStyles.metaText}>今日の日付 (JST): {today}</p>
        <p className={dashboardStyles.metaText}>売上サマリーの下に、承認待ち・本日の予定・各種最新情報を表示します。</p>

        <section className={dashboardStyles.paymentDashGrid} aria-label="売上サマリー">
          <article className={dashboardStyles.paymentDashCard}>
            <h2 className={dashboardStyles.paymentDashLabel}>今日の売上</h2>
            <p className={dashboardStyles.paymentDashValue}>{fmtYen(sumToday.amountTaxInclusive)}</p>
            <p className={dashboardStyles.paymentDashSub}>税抜 {fmtYen(sumToday.amountTaxExclusive)}</p>
          </article>
          <article className={dashboardStyles.paymentDashCard}>
            <h2 className={dashboardStyles.paymentDashLabel}>今月の売上</h2>
            <p className={dashboardStyles.paymentDashValue}>{fmtYen(sumMonth.amountTaxInclusive)}</p>
            <p className={dashboardStyles.paymentDashSub}>税抜 {fmtYen(sumMonth.amountTaxExclusive)}</p>
          </article>
          <article className={dashboardStyles.paymentDashCard}>
            <h2 className={dashboardStyles.paymentDashLabel}>本日の決済件数</h2>
            <p className={dashboardStyles.paymentDashValue}>{sumToday.count ?? 0}</p>
            <p className={dashboardStyles.paymentDashSub}>完了済み取引のみ集計</p>
          </article>
        </section>

        <section className={dashboardStyles.paymentRecentSection} aria-label="最近の決済">
          <div className={dashboardStyles.paymentRecentHead}>
            <h2 className={dashboardStyles.dashboardTitle}>最近の決済</h2>
            <div className={dashboardStyles.paymentRecentLinks}>
              <Link className={dashboardStyles.inlineActionLink} href="/admin/payments/input">
                決済管理へ
              </Link>
              <Link className={dashboardStyles.inlineActionLink} href="/admin/payments/statistics">
                統計へ
              </Link>
              <Link className={dashboardStyles.inlineActionLink} href="/admin/payments/settings">
                決済設定へ
              </Link>
            </div>
          </div>
          {recent.length === 0 ? (
            <p className={dashboardStyles.smallMuted}>決済データがありません。</p>
          ) : (
            <ul className={dashboardStyles.paymentRecentList}>
              {recent.map((t) => (
                <li key={t.id} className={dashboardStyles.paymentRecentItem}>
                  <div>
                    <span className={dashboardStyles.paymentRecentTime}>{String(t.paidAt || "").slice(0, 16)}</span>
                    <span className={dashboardStyles.paymentRecentName}>{t.studentNameSnapshot || "—"}</span>
                  </div>
                  <div className={dashboardStyles.paymentRecentMeta}>
                    <strong>{fmtYen(t.amountTaxInclusive)}</strong>
                    <span>{t.transactionKind === "point_grant" ? "ポイント" : "決済"}</span>
                    <span>{t.finalPoints ?? 0} pt</span>
                    {t.id ? (
                      <Link className={dashboardStyles.inlineActionLink} href={`/admin/payments/receipt/${t.id}`}>
                        レシート
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={dashboardStyles.dashboardGrid} style={{ marginTop: "1.25rem" }}>
          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>承認待ち予約 (優先対応)</h2>
            <p className={dashboardStyles.kpi}>{pendingApprovalReservations} 件</p>
            <AdminPendingApprovalPanel items={pendingApprovalItems} />
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>今日のスケジュール</h2>
            <p className={dashboardStyles.kpiSub}>
              {todaysReservations.length} 件 / 最初 {firstLesson} / 最後 {lastLesson}
            </p>
            <ul className={dashboardStyles.timelineList}>
              {todaysReservations.map((reservation) => (
                <li
                  key={`today-${reservation.id}`}
                  className={`${dashboardStyles.timelineItem} ${dashboardStyles[`timelineItem${reservationTone(reservation.status).charAt(0).toUpperCase() + reservationTone(reservation.status).slice(1)}`]}`}
                >
                  <span className={dashboardStyles.timelineTime}>{reservation.time || "--:--"}</span>
                  <span className={dashboardStyles.timelineSummary}>
                    {reservation.studentNameKanji || "-"} / {reservationStatusLabel(reservation.status)} /{" "}
                    {reservation.lessonDeliveryType === "online" ? "オンライン" : "対面"}
                  </span>
                  <Link
                    className={dashboardStyles.inlineActionLink}
                    href={`/admin/reservations?date=${encodeURIComponent(reservation.date || today)}&focus=pending`}
                  >
                    詳細
                  </Link>
                </li>
              ))}
              {todaysReservations.length === 0 ? <li className={dashboardStyles.timelineItem}>本日の予約はありません。</li> : null}
            </ul>
            <div className={dashboardStyles.actionRow}>
              <Link className={dashboardStyles.actionButton} href={`/admin/reservations?date=${today}`}>
                今日の予約を見る
              </Link>
              <Link className={dashboardStyles.actionButton} href={`/admin/reservations?date=${today}&focus=pending`}>
                承認待ちを確認
              </Link>
            </div>
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>未対応項目</h2>
            <ul className={dashboardStyles.actionTodoList}>
              <li>
                <span>未確認予約</span>
                <strong>{unhandledReservations} 件</strong>
                <Link className={dashboardStyles.inlineActionLink} href="/admin/reservations?focus=pending">
                  対応する
                </Link>
              </li>
              <li>
                <span>レッスンノート未作成</span>
                <strong>{missingLessonNotes} 件</strong>
                <Link className={dashboardStyles.inlineActionLink} href="/admin/lesson-notes">
                  作成へ
                </Link>
              </li>
              <li>
                <span>登録待ち学生</span>
                <strong>{pendingStudents} 名</strong>
                <Link className={dashboardStyles.inlineActionLink} href="/admin/students">
                  確認する
                </Link>
              </li>
              <li>
                <span>未公開お知らせ / 送信失敗メール</span>
                <strong>
                  {unpublishedNotices} / {failedMails}
                </strong>
                <Link className={dashboardStyles.inlineActionLink} href="/admin/notices">
                  編集する
                </Link>
              </li>
            </ul>
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>最近登録された学生</h2>
            <ul className={dashboardStyles.tableLike}>
              {recentStudents.map((student) => (
                <li key={student.id}>
                  学生番号 {student.studentNumber || "-"} / {student.nameKanji || "-"} /{" "}
                  {studentRegistrationLabel(student.registrationStatus, student.consentStatus)}
                </li>
              ))}
              {recentStudents.length === 0 ? <li>データがありません。</li> : null}
            </ul>
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>最近の予約</h2>
            <ul className={dashboardStyles.tableLike}>
              {recentReservations.map((reservation) => (
                <li key={reservation.id}>
                  {reservation.date} {reservation.time} / {reservation.studentNameKanji || "-"} /{" "}
                  {reservationStatusLabel(reservation.status)}
                </li>
              ))}
              {recentReservations.length === 0 ? <li>データがありません。</li> : null}
            </ul>
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>最近のレッスンノート</h2>
            <ul className={dashboardStyles.tableLike}>
              {recentNotes.map((note) => (
                <li key={note.id}>
                  {note.date || "-"} / {note.title || "レッスンノート"} / {note.studentCount || 0} 名
                </li>
              ))}
              {recentNotes.length === 0 ? <li>データがありません。</li> : null}
            </ul>
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>最近のメール送信</h2>
            <p className={dashboardStyles.kpiSub}>再送が必要: {retryMails} 件</p>
            <ul className={dashboardStyles.tableLike}>
              {recentMails.map((mail) => (
                <li key={mail.id}>
                  {String(mail.createdAt || "").slice(0, 16)} / {mailTypeLabel(mail.type)} /{" "}
                  {mail.recipientEmail || mail.toEmail || "-"} / {mailStatusLabel(mail.status)}
                </li>
              ))}
              {recentMails.length === 0 ? <li>データがありません。</li> : null}
            </ul>
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>最近の管理操作ログ</h2>
            <ul className={dashboardStyles.tableLike}>
              {recentLogs.map((log) => (
                <li key={log.id}>
                  {String(log.at || "").slice(0, 16)} / {adminActionLabel(log.action, log.summary)}
                </li>
              ))}
              {recentLogs.length === 0 ? <li>データがありません。</li> : null}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}

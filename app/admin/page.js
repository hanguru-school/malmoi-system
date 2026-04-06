import Link from "next/link";
import { requireRole } from "../../lib/auth/session";
import {
  getAdminLessonMinuteRiskSummary,
  getAdminLessonMinutesMonthSummary,
  listAuditLogsForAdmin,
  listHomeworksForAdmin,
  listLessonNotesForAdmin,
  listNoticesForAdmin,
  listMailLogsForAdmin,
  listReservationsForAdmin,
  listStudentsForAdmin,
} from "../../lib/auth/store";
import AdminTopNav from "./AdminTopNav";
import dashboardStyles from "./admin.module.css";
import AdminPendingApprovalPanel from "./AdminPendingApprovalPanel";

function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

function formatYearMonthJa(ym) {
  const [y, m] = String(ym || "").split("-");
  if (!y || !m) return ym || "—";
  return `${y}年${Number(m)}月`;
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
  };
  return map[value] || String(summary || "管理操作を実行");
}

export default async function AdminPage() {
  await requireRole(["admin"]);
  const today = todayInJst();
  const [
    students,
    reservations,
    lessonNotes,
    notices,
    auditLogs,
    mailLogs,
    resToday,
    homeworkTodayList,
    minuteRisk,
    lessonMinutesMonth,
  ] = await Promise.all([
    listStudentsForAdmin({}, { page: 1, pageSize: 500 }),
    listReservationsForAdmin({ page: 1, pageSize: 100 }),
    listLessonNotesForAdmin({}),
    listNoticesForAdmin(),
    listAuditLogsForAdmin({ page: 1, pageSize: 12 }),
    listMailLogsForAdmin({ page: 1, pageSize: 30 }),
    listReservationsForAdmin({ page: 1, pageSize: 800, fromDate: today, toDate: today }),
    listHomeworksForAdmin({ fromDate: today, toDate: today }),
    getAdminLessonMinuteRiskSummary(),
    getAdminLessonMinutesMonthSummary(),
  ]);

  const todaysReservations = (resToday.items || [])
    .filter((item) => String(item.date || "").slice(0, 10) === today)
    .sort((a, b) => `${a.time || ""}`.localeCompare(`${b.time || ""}`));
  const hwLessonToday = (homeworkTodayList || []).filter(
    (h) => String(h.lessonDate || "").slice(0, 10) === today
  );
  const hwTotalToday = hwLessonToday.length;
  const hwDoneToday = hwLessonToday.filter((h) =>
    ["reviewed", "completed"].includes(String(h.status || ""))
  ).length;
  const homeworkCompletionRate = hwTotalToday ? Math.round((hwDoneToday / hwTotalToday) * 100) : null;
  const activeStudentIds = new Set();
  todaysReservations.forEach((r) => {
    if (r.studentId) activeStudentIds.add(r.studentId);
  });
  hwLessonToday.forEach((h) => {
    if (h.studentId) activeStudentIds.add(h.studentId);
  });
  const activeStudentsToday = activeStudentIds.size;
  const todayTimes = todaysReservations.map((item) => String(item.time || "")).filter(Boolean).sort();
  const firstLesson = todayTimes[0] || "-";
  const lastLesson = todayTimes[todayTimes.length - 1] || "-";

  const pendingStudents = (students.items || []).filter((item) => item.registrationStatus !== "completed").length;
  const pendingApprovalReservations = (reservations.items || []).filter(
    (item) => item.status === "requested",
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
  const opsAuditPreview = (auditLogs.items || []).slice(0, 4);
  const publishedNotices = (notices || [])
    .filter((n) => n.isActive !== false)
    .sort((a, b) => String(b.publishedAt || b.updatedAt || "").localeCompare(String(a.publishedAt || a.updatedAt || "")))
    .slice(0, 3);
  const recentMails = (mailLogs.items || []).slice(0, 5);
  const failedMails = (mailLogs.items || []).filter((item) => item.status === "failed").length;
  const retryMails = (mailLogs.items || []).filter((item) => item.status === "failed" || item.status === "retry_target").length;
  const lessonMinutesRiskAttention =
    (minuteRisk?.depleted ?? 0) + (minuteRisk?.low180 ?? 0) + (minuteRisk?.nextReservationInsufficient ?? 0) > 0;
  const pendingApprovalItems = (reservations.items || [])
    .filter((item) => item.status === "requested")
    .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`))
    .slice(0, 6);

  return (
    <div className={dashboardStyles.adminShell}>
      <main className={dashboardStyles.adminCard}>
        <AdminTopNav currentPath="/admin" showPageTitle pageTitle="管理ダッシュボード" />
        <p className={dashboardStyles.metaText}>今日の日付: {today}</p>
        <p className={dashboardStyles.metaText}>承認待ち予約を最優先で処理し、続いて本日の予定を確認してください。</p>

        <section className={dashboardStyles.opsSummaryStrip} aria-label="運営サマリー">
          <article className={dashboardStyles.opsSummaryCard}>
            <p className={dashboardStyles.opsSummaryLabel}>本日の未処理</p>
            <p className={dashboardStyles.opsSummaryValue}>一覧</p>
            <Link className={dashboardStyles.opsSummaryLink} href="/admin/ops-today">
              抜け・提出待ちをまとめて見る
            </Link>
          </article>
          <article className={dashboardStyles.opsSummaryCard}>
            <p className={dashboardStyles.opsSummaryLabel}>本日の運営KPI</p>
            <ul className={dashboardStyles.opsSummaryList}>
              <li>本日レッスン枠: {todaysReservations.length} 件</li>
              <li>
                本日宿題 完了率:{" "}
                {homeworkCompletionRate === null ? "—" : `${homeworkCompletionRate}%`}（{hwDoneToday}/{hwTotalToday || 0}）
              </li>
              <li>アクティブ学生（概算）: {activeStudentsToday} 名</li>
            </ul>
            <Link className={dashboardStyles.opsSummaryLink} href="/admin/homework">
              宿題管理へ
            </Link>
          </article>
          <article className={dashboardStyles.opsSummaryCard}>
            <p className={dashboardStyles.opsSummaryLabel}>本日の予約</p>
            <p className={dashboardStyles.opsSummaryValue}>{todaysReservations.length} 件</p>
            <Link className={dashboardStyles.opsSummaryLink} href={`/admin/reservations?date=${today}`}>
              予約一覧を開く
            </Link>
          </article>
          <article className={dashboardStyles.opsSummaryCard}>
            <p className={dashboardStyles.opsSummaryLabel}>登録進行中の学生</p>
            <p className={dashboardStyles.opsSummaryValue}>{pendingStudents} 名</p>
            <Link className={dashboardStyles.opsSummaryLink} href="/admin/students">
              学生一覧を開く
            </Link>
          </article>
          <article
            className={`${dashboardStyles.opsSummaryCard}${
              lessonMinutesRiskAttention ? ` ${dashboardStyles.opsSummaryCardAttention}` : ""
            }`}
          >
            <p className={dashboardStyles.opsSummaryLabel}>レッスン時間（要注意）</p>
            <ul className={dashboardStyles.opsSummaryList}>
              <li>残り0以下: {minuteRisk?.depleted ?? 0} 名</li>
              <li>残り180分以下: {minuteRisk?.low180 ?? 0} 名</li>
              <li>次回予約で不足の恐れ: {minuteRisk?.nextReservationInsufficient ?? 0} 名</li>
            </ul>
            <Link className={dashboardStyles.opsSummaryLink} href="/admin/students/at-risk">
              要フォロー学生を見る
            </Link>
          </article>
          <article className={dashboardStyles.opsSummaryCard}>
            <p className={dashboardStyles.opsSummaryLabel}>今月のレッスン時間（原簿・JST）</p>
            <p className={dashboardStyles.opsSummaryValue}>{formatYearMonthJa(lessonMinutesMonth?.yearMonth)}</p>
            <ul className={dashboardStyles.opsSummaryList}>
              <li>消費（usage 合計）: {lessonMinutesMonth?.monthUsageMinutes ?? 0} 分</li>
              <li>付与（charge 合計）: {lessonMinutesMonth?.monthChargeMinutes ?? 0} 分</li>
              <li>
                手動調整: +{lessonMinutesMonth?.monthManualPositiveMinutes ?? 0} / −
                {lessonMinutesMonth?.monthManualNegativeMinutes ?? 0} 分
              </li>
              <li>原簿に動きのあった学生: {lessonMinutesMonth?.activeStudentCount ?? 0} 名</li>
              <li>現在 残り0以下: {lessonMinutesMonth?.depletedStudentCount ?? 0} 名</li>
            </ul>
            <Link className={dashboardStyles.opsSummaryLink} href="/admin/students">
              学生一覧で確認
            </Link>
          </article>
          <article className={dashboardStyles.opsSummaryCard}>
            <p className={dashboardStyles.opsSummaryLabel}>最近のお知らせ</p>
            {publishedNotices.length === 0 ? (
              <p className={dashboardStyles.metaText} style={{ marginTop: "0.35rem" }}>
                公開中のお知らせはありません。
              </p>
            ) : (
              <ul className={dashboardStyles.opsSummaryList}>
                {publishedNotices.map((n) => (
                  <li key={n.id}>{String(n.title || "").slice(0, 42) || "—"}</li>
                ))}
              </ul>
            )}
            <Link className={dashboardStyles.opsSummaryLink} href="/admin/notices">
              お知らせ管理へ
            </Link>
          </article>
          <article className={dashboardStyles.opsSummaryCard}>
            <p className={dashboardStyles.opsSummaryLabel}>最近の監査ログ</p>
            {opsAuditPreview.length === 0 ? (
              <p className={dashboardStyles.metaText} style={{ marginTop: "0.35rem" }}>
                ログがありません。
              </p>
            ) : (
              <ul className={dashboardStyles.opsSummaryList}>
                {opsAuditPreview.map((log) => (
                  <li key={log.id}>
                    {String(log.at || "").slice(0, 16)} {adminActionLabel(log.action, log.summary)}
                  </li>
                ))}
              </ul>
            )}
            <Link className={dashboardStyles.opsSummaryLink} href="/admin#admin-recent-audit">
              詳細ログへ
            </Link>
          </article>
        </section>

        <section className={dashboardStyles.dashboardGrid}>
          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>承認待ち予約 (優先対応)</h2>
            <p className={dashboardStyles.kpi}>{pendingApprovalReservations} 件</p>
            <AdminPendingApprovalPanel items={pendingApprovalItems} />
          </article>

          <article className={dashboardStyles.dashboardCard}>
            <h2 className={dashboardStyles.dashboardTitle}>今日の予定</h2>
            <p className={dashboardStyles.kpi}>{todaysReservations.length} 件</p>
            <p className={dashboardStyles.kpiSub}>最初のレッスン: {firstLesson}</p>
            <p className={dashboardStyles.kpiSub}>最後のレッスン: {lastLesson}</p>
            <ul className={dashboardStyles.tableLike}>
              {todaysReservations.map((reservation) => (
                <li key={`today-${reservation.id}`}>
                  {reservation.time || "-"} / {reservation.studentNameKanji || "-"} / {reservationStatusLabel(reservation.status)} /{" "}
                  {reservation.lessonDeliveryType === "online" ? "オンライン" : "対面"}
                </li>
              ))}
              {todaysReservations.length === 0 ? <li>本日の予約はありません。</li> : null}
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
            <h2 className={dashboardStyles.dashboardTitle}>対応が必要な項目</h2>
            <ul className={dashboardStyles.kpiList}>
              <li>登録待ち学生: {pendingStudents} 名</li>
              <li>承認待ち予約: {pendingApprovalReservations} 件</li>
              <li>未作成レッスンノート: {missingLessonNotes} 件</li>
              <li>未公開お知らせ: {unpublishedNotices} 件</li>
              <li>送信失敗メール: {failedMails} 件</li>
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

          <article id="admin-recent-audit" className={dashboardStyles.dashboardCard}>
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

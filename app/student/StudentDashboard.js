"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { studentReservationsPathFromBrowserPreference } from "../../lib/student/reservationUiPreference";
import home from "./student-home.module.css";
import StudentLessonTimeFlow from "./StudentLessonTimeFlow";
import StudentReservationMiniCalendar from "./StudentReservationMiniCalendar";
import {
  studentReservationStatusLabel,
  studentReservationStatusSubline,
  studentReservationStatusTone,
} from "./dashboardReservationStatus";
import { jpStudentPaymentCategory } from "../../lib/payments/receipt-labels";

function resolveProfileImageSrc(student) {
  if (!student || typeof student !== "object") return "";
  const direct = String(student.profileImage || "").trim();
  if (direct) return direct;
  const fromCrm = String(student.crmProfile?.profileImageDataUrl || "").trim();
  return fromCrm;
}

function DefaultAvatar({ name }) {
  const initial = String(name || "?").trim().charAt(0) || "?";
  return (
    <div className={home.heroAvatarFallback} aria-hidden>
      <span className={home.heroAvatarInitial}>{initial}</span>
    </div>
  );
}

function deliveryLabel(t) {
  return String(t || "") === "online" ? "オンライン" : "対面";
}

function formatWhen(iso) {
  if (!iso) return "—";
  return String(iso).replace("T", " ").slice(0, 16);
}

function homeworkIsDone(status) {
  return status === "reviewed" || status === "completed";
}

function homeworkStudentLabel(status) {
  if (homeworkIsDone(status)) return "完了";
  return "未完了";
}

function truncate(text, max) {
  const s = String(text || "").trim();
  if (!s) return "";
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function daysFromTodayYmd(lessonDateYmd, todayYmd) {
  if (!lessonDateYmd || !todayYmd) return null;
  const a = new Date(`${String(lessonDateYmd).slice(0, 10)}T12:00:00`);
  const b = new Date(`${String(todayYmd).slice(0, 10)}T12:00:00`);
  const ms = a.getTime() - b.getTime();
  if (Number.isNaN(ms)) return null;
  return Math.round(ms / 86400000);
}

function computeFlowStep({ todayLessons, recentLessonNotes, homeworkItems }) {
  const list = homeworkItems || [];
  const pending = list.filter((h) => !homeworkIsDone(h.status));
  if (pending.length > 0) return 3;
  if (list.length > 0) return 4;
  if ((recentLessonNotes || []).length > 0) return 2;
  if ((todayLessons || []).length > 0) return 1;
  return 0;
}

const FLOW_LABELS = ["未受講", "受講", "ノート", "宿題", "完了"];

export default function StudentDashboard({
  session,
  nextReservation,
  calendarReservations = [],
  reservedMinutesSum = 0,
  notices = [],
  recentLessonNotes = [],
  homeworkItems = [],
  todayLessons = [],
  todayYmd = "",
  recentPayments = [],
  recentMinuteLogs = [],
  reservationsHref: reservationsHrefProp = "/student/reservations",
}) {
  const [reservationsHref, setReservationsHref] = useState(reservationsHrefProp);

  useEffect(() => {
    setReservationsHref(studentReservationsPathFromBrowserPreference());
  }, [reservationsHrefProp]);

  const student = session?.student || {};
  const minutes = student.lessonMinutes || {};
  const points = student.points || {};
  const displayName = student.nameKanji || session?.user?.displayName || "ゲスト";
  const profileSrc = resolveProfileImageSrc(student);

  const pendingHomework = homeworkItems.filter((h) => !homeworkIsDone(h.status));
  const flowStep = computeFlowStep({ todayLessons, recentLessonNotes, homeworkItems });
  const firstToday = todayLessons[0] || null;

  const daysToNext = nextReservation?.date ? daysFromTodayYmd(nextReservation.date, todayYmd) : null;
  const upcomingSoon = daysToNext !== null && daysToNext >= 0 && daysToNext <= 3;
  const reservationFar = daysToNext !== null && daysToNext > 14;

  /**
   * 次の一手（1つだけ high）:
   * 未完了宿題 → 宿題 / 次レッスン3日以内 → 予約確認 / 最近ノートあり → ノート /
   * 予約なし or 遠い予約のみ → 予約する
   */
  const retentionFocus = (() => {
    if (pendingHomework.length > 0) return "homework";
    if (nextReservation && upcomingSoon) return "upcoming";
    if (recentLessonNotes.length > 0) return "notes";
    if (!nextReservation || reservationFar) return "reserve";
    return "none";
  })();

  const showLearningHub =
    firstToday ||
    pendingHomework.length > 0 ||
    (recentLessonNotes && recentLessonNotes.length > 0);

  return (
    <div className={home.homeRoot}>
      <header className={home.hero} aria-label="プロフィール">
        <div className={home.heroAvatar}>
          {profileSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URLs / external uploads
            <img className={home.heroAvatarImg} src={profileSrc} alt="" width={72} height={72} />
          ) : (
            <DefaultAvatar name={displayName} />
          )}
        </div>
        <div className={home.heroText}>
          <p className={home.heroGreeting}>こんにちは、{displayName}さん</p>
          <p className={home.heroMember}>会員番号 {student.studentNumber || "—"}</p>
        </div>
      </header>

      <nav className={home.retentionStrip} aria-label="次の一手">
        <p className={home.retentionStripTitle}>次の一手</p>
        <div className={home.retentionStripRow}>
          <Link
            className={home.retentionTile}
            href={reservationsHref}
            data-emphasis={
              retentionFocus === "reserve" || retentionFocus === "upcoming" ? "high" : "low"
            }
          >
            <span className={home.retentionTileEyebrow}>予約</span>
            <span className={home.retentionTileText}>
              {retentionFocus === "upcoming"
                ? "次の予約を確認"
                : retentionFocus === "reserve"
                  ? "予約する"
                  : "一覧・新規"}
            </span>
          </Link>
          <Link
            className={home.retentionTile}
            href="/student/lesson-notes"
            data-emphasis={retentionFocus === "notes" ? "high" : "low"}
          >
            <span className={home.retentionTileEyebrow}>ノート</span>
            <span className={home.retentionTileText}>
              {retentionFocus === "notes" ? "ノートを確認" : "確認"}
            </span>
          </Link>
          <Link
            className={home.retentionTile}
            href="/student/homework"
            data-emphasis={retentionFocus === "homework" ? "high" : "low"}
          >
            <span className={home.retentionTileEyebrow}>宿題</span>
            <span className={home.retentionTileText}>
              {pendingHomework.length > 0 ? `未完了 ${pendingHomework.length}` : "一覧"}
            </span>
          </Link>
        </div>
      </nav>

      <section className={home.section} aria-label="次の予約">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>次の予約</h2>
          <Link className={home.sectionLink} href={reservationsHref}>
            予約一覧へ
          </Link>
        </div>
        {nextReservation ? (
          <article className={home.nextCard}>
            <div className={home.nextTop}>
              <div className={home.nextDateBlock}>
                <p className={home.nextDate}>{nextReservation.date || "—"}</p>
                <p className={home.nextTime}>{nextReservation.time || "—"} 〜</p>
              </div>
              <span className={home.statusBadge} data-status={studentReservationStatusTone(nextReservation.status)}>
                {studentReservationStatusLabel(nextReservation.status)}
              </span>
            </div>
            {studentReservationStatusSubline(nextReservation) ? (
              <p className={home.nextSubline}>{studentReservationStatusSubline(nextReservation)}</p>
            ) : null}
            <ul className={home.nextMeta}>
              <li>
                <span className={home.nextMetaLab}>レッスン時間</span>
                <span className={home.nextMetaVal}>{nextReservation.durationMinutes ?? "—"} 分</span>
              </li>
              <li>
                <span className={home.nextMetaLab}>形式</span>
                <span className={home.nextMetaVal}>{deliveryLabel(nextReservation.lessonDeliveryType)}</span>
              </li>
              <li>
                <span className={home.nextMetaLab}>講師</span>
                <span className={home.nextMetaVal}>{nextReservation.instructorName || "未定"}</span>
              </li>
            </ul>
            <div className={home.nextActionRow}>
              <Link className={home.nextCta} href={reservationsHref}>
                詳細・変更・キャンセル
              </Link>
              <p className={home.nextActionHint}>
                変更・キャンセルは予約画面の一覧から操作できます。
              </p>
            </div>
          </article>
        ) : (
          <div className={home.nextEmpty}>
            <p>次の予約はまだありません。</p>
            <Link className={home.nextEmptyBtn} href={reservationsHref}>
              予約する
            </Link>
          </div>
        )}
      </section>

      <section className={home.section} aria-label="利用状況">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>利用状況</h2>
        </div>
        <div className={home.statusCard}>
          <StudentLessonTimeFlow
            variant="dashboard"
            totalMinutes={minutes.totalMinutes ?? 0}
            usedMinutes={minutes.usedMinutes ?? 0}
            remainingMinutes={minutes.remainingMinutes ?? 0}
            pointsBalance={points.balance ?? 0}
            pointConvertedMinutes={student.pointConvertedMinutes ?? 0}
            reservedMinutesOverride={reservedMinutesSum}
          />
        </div>
      </section>

      <div className={home.primaryCtaBlock} aria-label="予約のメイン操作">
        <Link className={home.primaryCtaButton} href={reservationsHref}>
          予約する
        </Link>
        <p className={home.primaryCtaSub}>新規予約・一覧・変更はこちらから</p>
      </div>

      <section className={home.section} aria-label="メイン">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>メイン</h2>
        </div>
        <div className={home.midGrid}>
          <Link className={home.midTile} href={reservationsHref}>
            <span className={home.midTileEyebrow}>予約</span>
            <span className={home.midTileTitle}>予約一覧</span>
          </Link>
          <Link className={home.midTile} href="/student/lesson-notes">
            <span className={home.midTileEyebrow}>学習</span>
            <span className={home.midTileTitle}>レッスンノート</span>
          </Link>
          <Link className={home.midTile} href="/student/homework">
            <span className={home.midTileEyebrow}>学習</span>
            <span className={home.midTileTitle}>宿題</span>
          </Link>
        </div>
      </section>

      <section className={home.section} aria-label="お知らせ">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>お知らせ</h2>
          <Link className={home.sectionLink} href="/student/notices">
            一覧
          </Link>
        </div>
        <div className={home.noticeBoard}>
          {notices.length > 0 ? (
            <ul className={home.noticeBoardList}>
              {notices.map((notice) => (
                <li key={notice.id}>
                  <article className={home.noticeCard}>
                    <div className={home.noticeCardTop}>
                      <p className={home.noticeCardTitle}>{notice.title}</p>
                      {notice.isImportant ? <span className={home.noticeImportant}>重要</span> : null}
                    </div>
                    <p className={home.noticeCardDate}>
                      {String(notice.publishedAt || notice.updatedAt || "").slice(0, 10) || "—"}
                    </p>
                    <Link className={home.noticeCardBtn} href={`/student/notices/${notice.id}`}>
                      詳細を見る
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className={home.learnEmpty}>表示できるお知らせはありません。</p>
          )}
        </div>
      </section>

      <section className={home.section} aria-label="プロフィール">
        <Link className={home.profileStrip} href="/student/profile">
          <div className={home.profileStripText}>
            <span className={home.profileStripLabel}>プロフィール</span>
            <span className={home.profileStripSub}>個人情報・レッスン時間の確認</span>
          </div>
          <span className={home.profileStripChev} aria-hidden>
            ›
          </span>
        </Link>
      </section>

      <div className={home.secondaryRegion} aria-label="詳細・記録">
        <p className={home.secondaryRegionTitle}>詳細・記録</p>

      <section className={home.section} aria-label="今日の学習">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>今日の学習</h2>
          <span className={home.todayDatePill}>{todayYmd || "—"}</span>
        </div>
        <div className={home.flowTrack} role="list" aria-label="学習の流れ">
          {FLOW_LABELS.map((label, i) => (
            <div
              key={label}
              role="listitem"
              className={home.flowStep}
              data-active={i === flowStep ? "on" : "off"}
              data-past={i < flowStep ? "yes" : "no"}
            >
              <span className={home.flowDot} />
              <span className={home.flowLab}>{label}</span>
            </div>
          ))}
        </div>

        {showLearningHub ? (
          <div className={home.todayStack}>
            {firstToday ? (
              <article className={home.todayBlock} data-kind="lesson">
                <p className={home.todayBlockEyebrow}>今日のレッスン</p>
                <p className={home.todayBlockTitle}>
                  {firstToday.time || "—"} 〜 · {firstToday.durationMinutes ?? "—"}分
                </p>
                <p className={home.todayBlockMeta}>講師 {firstToday.instructorName || "未定"}</p>
                <Link className={home.todayBlockCta} href={reservationsHref}>
                  詳細を見る
                </Link>
              </article>
            ) : null}

            {pendingHomework.length > 0 ? (
              <article className={home.todayBlock} data-kind="homework">
                <p className={home.todayBlockEyebrow}>宿題があります</p>
                <p className={home.todayBlockTitle}>未完了 {pendingHomework.length} 件</p>
                <Link className={home.todayBlockCta} href="/student/homework">
                  宿題を見る
                </Link>
              </article>
            ) : null}

            {recentLessonNotes[0] ? (
              <article className={home.todayBlock} data-kind="review">
                <p className={home.todayBlockEyebrow}>復習</p>
                <p className={home.todayBlockTitle}>前回の復習をしましょう</p>
                <Link className={home.todayBlockCtaSecondary} href={`/student/lesson-notes#note-${recentLessonNotes[0].id}`}>
                  レッスンノートを見る
                </Link>
              </article>
            ) : null}
          </div>
        ) : (
          <p className={home.todayEmpty}>今日のおすすめはありません。次のレッスンを楽しみにしていてください。</p>
        )}
      </section>

      <section className={home.section} aria-label="最新レッスンノート">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>最新レッスンノート</h2>
          <Link className={home.sectionLink} href="/student/lesson-notes">
            すべて見る
          </Link>
        </div>
        {recentLessonNotes.length > 0 ? (
          <ul className={home.learnCardList}>
            {recentLessonNotes.map((note) => (
              <li key={note.id}>
                <article className={home.noteCard}>
                  <div className={home.noteCardTop}>
                    <p className={home.noteCardDate}>{note.date || String(note.updatedAt || "").slice(0, 10) || "—"}</p>
                    {note.hasAudio ? (
                      <span className={home.noteAudioBadge} title="音声の可能性あり">
                        音声
                      </span>
                    ) : (
                      <span className={home.noteAudioMuted}>音声なし</span>
                    )}
                  </div>
                  <p className={home.noteCardTitle}>{note.title || "レッスンノート"}</p>
                  <p className={home.noteCardSummary}>{truncate(note.summary || note.content, 72) || "—"}</p>
                  {note.teacherName ? <p className={home.noteCardTeacher}>講師 {note.teacherName}</p> : null}
                  <Link className={home.noteCardBtn} href={`/student/lesson-notes#note-${note.id}`}>
                    ノートを見る
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className={home.learnEmpty}>公開されたレッスンノートはまだありません。</p>
        )}
      </section>

      <section className={home.section} aria-label="宿題">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>宿題</h2>
          <Link className={home.sectionLink} href="/student/homework">
            宿題を見る
          </Link>
        </div>
        {homeworkItems.length > 0 ? (
          <ul className={home.learnCardList}>
            {homeworkItems.slice(0, 5).map((hw) => {
              const done = homeworkIsDone(hw.status);
              return (
                <li key={hw.id}>
                  <article className={home.hwCard} data-done={done ? "yes" : "no"}>
                    <div className={home.hwCardTop}>
                      <p className={home.hwCardTitle}>{hw.title || "宿題"}</p>
                      <span className={home.hwStatus} data-done={done ? "yes" : "no"}>
                        {homeworkStudentLabel(hw.status)}
                      </span>
                    </div>
                    {hw.dueDate ? <p className={home.hwDue}>期限 {hw.dueDate}</p> : <p className={home.hwDueMuted}>期限なし</p>}
                    <Link className={home.hwCardBtn} href={`/student/homework/${hw.id}`}>
                      宿題を見る
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={home.learnEmpty}>表示できる宿題はありません。</p>
        )}
      </section>

      <section className={home.section} aria-label="予定カレンダー">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>予定の流れ</h2>
        </div>
        <div className={home.calendarShell}>
          <StudentReservationMiniCalendar reservations={calendarReservations} reservationsHref={reservationsHref} />
        </div>
      </section>

      <section className={home.section} aria-label="最近の記録">
        <div className={home.sectionHead}>
          <h2 className={home.sectionTitle}>最近の記録</h2>
        </div>
        <div className={home.activityCard}>
          <p className={home.activityBlockTitle}>お支払い・ポイント</p>
          {recentPayments.length > 0 ? (
            <ul className={home.activityList}>
              {recentPayments.map((t) => (
                <li key={t.id} className={home.activityRow}>
                  <span className={home.activityWhen}>{formatWhen(t.paidAt)}</span>
                  <Link className={home.activityMain} href={`/student/payments/${t.id}`}>
                    {jpStudentPaymentCategory(t)} · 税込 {t.amountTaxInclusive} 円 · +{t.finalPoints ?? 0} pt
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={home.activityEmpty}>まだ表示できる決済はありません。</p>
          )}
          <p className={home.bottomMore} style={{ marginTop: "0.65rem" }}>
            <Link href="/student/payments">決済履歴を見る</Link>
          </p>
        </div>

        <div className={home.activityCard} style={{ marginTop: "0.65rem" }}>
          <p className={home.activityBlockTitle}>レッスン時間</p>
          {recentMinuteLogs.length > 0 ? (
            <ul className={home.activityList}>
              {recentMinuteLogs.map((log) => (
                <li key={log.id} className={home.activityRow}>
                  <span className={home.activityWhen}>{formatWhen(log.at)}</span>
                  <span className={home.activityMain}>{log.summary}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={home.activityEmpty}>まだ表示できる記録はありません。</p>
          )}
          <p className={home.bottomMore} style={{ marginTop: "0.65rem" }}>
            <Link href="/student/profile">時間・プロフィールを見る</Link>
          </p>
        </div>
      </section>

      </div>

      <section className={home.section} aria-label="その他のリンク">
        <h2 className={home.sectionTitle} style={{ marginBottom: "0.35rem" }}>
          その他
        </h2>
        <div className={home.quickGrid}>
          <Link className={home.quickLink} href="/student/payments">
            <span className={home.quickIcon} aria-hidden>
              💳
            </span>
            決済履歴
          </Link>
          <Link className={home.quickLink} href="/student/progress">
            <span className={home.quickIcon} aria-hidden>
              📈
            </span>
            学習状況
          </Link>
        </div>
      </section>
    </div>
  );
}

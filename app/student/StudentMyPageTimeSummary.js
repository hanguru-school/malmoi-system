"use client";

import Link from "next/link";
import home from "./student-home.module.css";
import s from "./student.module.css";

/**
 * マイページ専用：時間のみ（ポイント表記なし）
 */
export default function StudentMyPageTimeSummary({
  remainingMinutes = 0,
  reservedMinutesSum = 0,
  nextReservation = null,
  nextReservationDeductMinutes = 0,
  projectedRemainingAfterNext = null,
}) {
  const rem = Math.max(0, Number(remainingMinutes) || 0);
  const reserved = Math.max(0, Number(reservedMinutesSum) || 0);
  const bookable = Math.max(0, rem - reserved);
  const nextDur = Math.max(0, Number(nextReservationDeductMinutes) || 0);
  const hasNext = Boolean(nextReservation && nextDur > 0);
  const projected =
    typeof projectedRemainingAfterNext === "number" && Number.isFinite(projectedRemainingAfterNext)
      ? Math.max(0, projectedRemainingAfterNext)
      : null;

  return (
    <div className={home.mypageTimeSummary}>
      <div className={s.timeFlowHeroRow} role="group" aria-label="残り時間と予約可能時間">
        <article className={s.timeFlowCardHero} data-emphasis="remaining">
          <p className={s.timeFlowHeroLabel}>残り時間</p>
          <p className={s.timeFlowHeroValue}>
            <span className={s.timeFlowHeroNumber}>{rem}</span>
            <span className={s.timeFlowHeroUnit}>分</span>
          </p>
        </article>
        <article className={s.timeFlowCardHero} data-emphasis="bookable">
          <p className={s.timeFlowHeroLabel}>予約可能時間</p>
          <p className={s.timeFlowHeroValue}>
            <span className={s.timeFlowHeroNumber}>{bookable}</span>
            <span className={s.timeFlowHeroUnit}>分</span>
          </p>
        </article>
      </div>

      <div className={home.mypageTimeDetailGrid}>
        <article className={home.mypageTimeDetailCard}>
          <p className={home.mypageTimeDetailLabel}>次回レッスン</p>
          {hasNext ? (
            <>
              <p className={home.mypageTimeDetailMain}>
                {nextReservation.date || "—"} {nextReservation.time || ""}
              </p>
              <p className={home.mypageTimeDetailSub}>所要 {nextDur} 分</p>
            </>
          ) : (
            <p className={home.mypageTimeDetailMuted}>確定した次回予約はありません</p>
          )}
        </article>
        <article className={home.mypageTimeDetailCard}>
          <p className={home.mypageTimeDetailLabel}>今回の予約で使う時間</p>
          <p className={home.mypageTimeDetailMain}>
            {hasNext ? (
              <>
                <span className={home.mypageTimeDetailNum}>{nextDur}</span>
                <span className={home.mypageTimeDetailUnit}>分</span>
              </>
            ) : (
              <span className={home.mypageTimeDetailMuted}>—</span>
            )}
          </p>
        </article>
        <article className={home.mypageTimeDetailCard}>
          <p className={home.mypageTimeDetailLabel}>予約後の残り時間（目安）</p>
          {projected != null && hasNext ? (
            <p className={home.mypageTimeDetailMain}>
              <span className={home.mypageTimeDetailNum}>{projected}</span>
              <span className={home.mypageTimeDetailUnit}>分</span>
            </p>
          ) : (
            <p className={home.mypageTimeDetailMuted}>次回予約がないため表示しません</p>
          )}
        </article>
      </div>

      <p className={home.mypageTimeSummaryFoot}>
        ポイントや購入履歴の内訳は
        <Link href="/student/lesson-time">レッスン時間・利用状況</Link>
        で確認できます。
      </p>
    </div>
  );
}

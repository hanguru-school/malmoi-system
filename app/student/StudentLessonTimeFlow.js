"use client";

import styles from "./student.module.css";
import { useStudentReservedMinutes } from "./lessonTimeSummaryUtils";

/**
 * サーバー値（lessonMinutes / points）はそのまま利用。
 * 予約済み分はクライアントで予約一覧から合算（保存ロジックは変更なし）。
 */
export default function StudentLessonTimeFlow({
  totalMinutes = 0,
  usedMinutes = 0,
  remainingMinutes = 0,
  pointsBalance = 0,
  pointConvertedMinutes = 0,
  variant = "profile",
  /** サーバーで予約一覧から合算した分。渡された場合は API 再取得しない */
  reservedMinutesOverride = null,
}) {
  const reservedRaw = useStudentReservedMinutes();
  const reservedFromHook = reservedRaw == null ? null : Math.max(0, reservedRaw);
  const reserved =
    reservedMinutesOverride != null && Number.isFinite(Number(reservedMinutesOverride))
      ? Math.max(0, Number(reservedMinutesOverride))
      : reservedFromHook;
  const bookable =
    reserved == null ? null : Math.max(0, Number(remainingMinutes || 0) - reserved);

  const isProfile = variant === "profile";

  return (
    <div className={isProfile ? styles.timeFlowBlock : styles.timeFlowBlockDashboard}>
      {isProfile ? <h2 className={styles.profileOverviewSummaryTitle}>時間・ポイント</h2> : null}

      <div className={styles.timeFlowHeroRow} role="group" aria-label="残り時間と予約可能時間">
        <article className={styles.timeFlowCardHero} data-emphasis="remaining">
          <p className={styles.timeFlowHeroLabel}>残り時間</p>
          <p className={styles.timeFlowHeroValue}>
            <span className={styles.timeFlowHeroNumber}>{remainingMinutes ?? 0}</span>
            <span className={styles.timeFlowHeroUnit}>分</span>
          </p>
        </article>
        <article className={styles.timeFlowCardHero} data-emphasis="bookable">
          <p className={styles.timeFlowHeroLabel}>予約可能時間</p>
          <p className={styles.timeFlowHeroValue}>
            {bookable == null ? (
              <span className={styles.timeFlowHeroLoading}>…</span>
            ) : (
              <>
                <span className={styles.timeFlowHeroNumber}>{bookable}</span>
                <span className={styles.timeFlowHeroUnit}>分</span>
              </>
            )}
          </p>
        </article>
      </div>

      <div className={styles.timeFlowSecondaryRow} role="group" aria-label="使用済みと予約済み">
        <article className={styles.timeFlowCardSub}>
          <p className={styles.timeFlowSubLabel}>使用済み時間</p>
          <p className={styles.timeFlowSubValue}>
            {usedMinutes ?? 0}
            <span className={styles.timeFlowSubUnit}>分</span>
          </p>
        </article>
        <article className={styles.timeFlowCardSub}>
          <p className={styles.timeFlowSubLabel}>予約済み時間</p>
          <p className={styles.timeFlowSubValue}>
            {reserved == null ? (
              <span className={styles.timeFlowHeroLoading}>…</span>
            ) : (
              <>
                {reserved}
                <span className={styles.timeFlowSubUnit}>分</span>
              </>
            )}
          </p>
        </article>
      </div>

      <div className={styles.timeFlowTertiary}>
        <span className={styles.timeFlowTertiaryLabel}>総購入時間</span>
        <span className={styles.timeFlowTertiaryValue}>
          {totalMinutes ?? 0}
          <span className={styles.timeFlowTertiaryUnit}>分</span>
        </span>
      </div>

      <div
        className={`${styles.timeFlowPointsRow} ${!isProfile ? styles.timeFlowPointsRowDashboard : ""}`}
        role="group"
        aria-label="ポイント"
      >
        <article className={styles.timeFlowPointCard}>
          <p className={styles.timeFlowPointLabel}>現在のポイント</p>
          <p className={styles.timeFlowPointValue}>
            <span className={styles.timeFlowPointNumber}>{pointsBalance ?? 0}</span>
            <span className={styles.timeFlowPointUnit}>pt</span>
          </p>
        </article>
        {!isProfile ? (
          <div className={styles.timeFlowPointBridge} aria-hidden>
            <span className={styles.timeFlowPointBridgeArrow}>≈</span>
          </div>
        ) : null}
        <article className={styles.timeFlowPointCard} data-muted>
          <p className={styles.timeFlowPointLabel}>ポイント換算（参考）</p>
          <p className={styles.timeFlowPointValue}>
            <span className={styles.timeFlowPointNumber}>{pointConvertedMinutes ?? 0}</span>
            <span className={styles.timeFlowPointUnit}>分</span>
          </p>
        </article>
      </div>
      {!isProfile ? (
        <p className={styles.timeFlowDashboardFootnote}>
          ポイント換算は参考値です。数値は登録済みの記録に基づきます。
        </p>
      ) : null}
    </div>
  );
}

"use client";

import styles from "./student.module.css";
import { useStudentReservedMinutes } from "./lessonTimeSummaryUtils";
import { referenceMinutesFromPoints } from "../../lib/operational/pointsPolicy.js";

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
  /** マイページ等でポイント欄を出さない */
  showPointsSection = true,
  /** 完了決済の finalPoints 合算など（渡したときだけ「総購入ポイント」を表示） */
  purchasedPointsTotal = null,
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
  const refMinutesFromBalance = referenceMinutesFromPoints(pointsBalance ?? 0);
  const displayRefMinutes =
    Number.isFinite(Number(pointConvertedMinutes)) && Number(pointConvertedMinutes) > 0
      ? Math.max(refMinutesFromBalance, Math.floor(Number(pointConvertedMinutes)))
      : refMinutesFromBalance;
  const purchasedPts =
    purchasedPointsTotal != null && Number.isFinite(Number(purchasedPointsTotal))
      ? Math.max(0, Math.floor(Number(purchasedPointsTotal)))
      : null;

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
        <span className={styles.timeFlowTertiaryLabel}>付与累計（レッスン時間）</span>
        <span className={styles.timeFlowTertiaryValue}>
          {totalMinutes ?? 0}
          <span className={styles.timeFlowTertiaryUnit}>分</span>
        </span>
      </div>

      {showPointsSection ? (
        <>
          <div
            className={`${purchasedPts != null ? styles.timeFlowPointsRowTriple : styles.timeFlowPointsRow} ${!isProfile ? styles.timeFlowPointsRowDashboard : ""}`}
            role="group"
            aria-label="ポイント"
          >
            {purchasedPts != null ? (
              <article className={styles.timeFlowPointCard}>
                <p className={styles.timeFlowPointLabel}>総購入ポイント</p>
                <p className={styles.timeFlowPointValue}>
                  <span className={styles.timeFlowPointNumber}>{purchasedPts}</span>
                  <span className={styles.timeFlowPointUnit}>pt</span>
                </p>
              </article>
            ) : null}
            <article className={styles.timeFlowPointCard}>
              <p className={styles.timeFlowPointLabel}>現在の保有ポイント</p>
              <p className={styles.timeFlowPointValue}>
                <span className={styles.timeFlowPointNumber}>{pointsBalance ?? 0}</span>
                <span className={styles.timeFlowPointUnit}>pt</span>
              </p>
            </article>
            {!isProfile && purchasedPts == null ? (
              <div className={styles.timeFlowPointBridge} aria-hidden>
                <span className={styles.timeFlowPointBridgeArrow}>≈</span>
              </div>
            ) : null}
            <article className={styles.timeFlowPointCard} data-muted>
              <p className={styles.timeFlowPointLabel}>時間換算（参考）</p>
              <p className={styles.timeFlowPointValue}>
                <span className={styles.timeFlowPointNumber}>{displayRefMinutes}</span>
                <span className={styles.timeFlowPointUnit}>分</span>
              </p>
            </article>
          </div>
          {isProfile ? (
            <p className={styles.timeFlowPolicyNote}>
              換算の目安：1分＝60ポイント。購入時は原則として1円＝1ポイントです。
            </p>
          ) : null}
          {!isProfile ? (
            <p className={styles.timeFlowDashboardFootnote}>
              時間換算は保有ポイント÷60の参考値です（切り捨て）。
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

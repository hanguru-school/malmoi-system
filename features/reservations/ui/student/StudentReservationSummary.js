"use client";

import flow from "./student-reservation-flow.module.css";

export default function StudentReservationSummary({
  remainingMinutes = null,
  bookableMinutes = null,
  nextReservationLabel = "",
  useMinutes = null,
  afterMinutes = null,
  loading = false,
}) {
  return (
    <div className={flow.summaryGrid} aria-label="予約に関する時間の概要">
      <div className={flow.summaryCard}>
        <span className={flow.summaryLabel}>残り時間</span>
        <span className={flow.summaryValue}>
          {loading ? "…" : remainingMinutes != null ? `${remainingMinutes}分` : "—"}
        </span>
        <span className={flow.summaryHint}>レッスンに使える残り</span>
      </div>
      <div className={flow.summaryCard}>
        <span className={flow.summaryLabel}>予約可能時間</span>
        <span className={flow.summaryValue}>
          {loading ? "…" : bookableMinutes != null ? `${bookableMinutes}分` : "—"}
        </span>
        <span className={flow.summaryHint}>規則上、予約に使える時間（目安）</span>
      </div>
      <div className={flow.summaryCard}>
        <span className={flow.summaryLabel}>次回予約</span>
        <span className={flow.summaryValue} style={{ fontSize: "0.82rem", lineHeight: 1.35 }}>
          {nextReservationLabel || "次回予約なし"}
        </span>
      </div>
      <div className={flow.summaryCard}>
        <span className={flow.summaryLabel}>今回の予約で使う時間</span>
        <span className={flow.summaryValue}>{useMinutes != null ? `${useMinutes}分` : "—"}</span>
        <span className={flow.summaryHint}>レッスンを選ぶと表示</span>
      </div>
      <div className={flow.summaryCard}>
        <span className={flow.summaryLabel}>予約後の残り時間</span>
        <span className={flow.summaryValue}>{afterMinutes != null ? `${afterMinutes}分` : "—"}</span>
        <span className={flow.summaryHint}>時間を選ぶと表示</span>
      </div>
    </div>
  );
}

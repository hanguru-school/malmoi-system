"use client";

import { lessonDeliveryLabel } from "../../../../lib/adapters/studentReservationView";
import flow from "./student-reservation-flow.module.css";

export default function StudentReservationConfirmCard({
  lessonName,
  date,
  startTime,
  endTime,
  teacherName,
  durationMinutes,
  useMinutes,
  afterMinutes,
  deliveryType,
  memo,
  onMemoChange,
}) {
  return (
    <div className={flow.confirmCard}>
      <div className={flow.confirmRow}>
        <span className={flow.confirmKey}>レッスン</span>
        <span className={flow.confirmVal}>{lessonName || "—"}</span>
      </div>
      <div className={flow.confirmRow}>
        <span className={flow.confirmKey}>日付</span>
        <span className={flow.confirmVal}>{date || "—"}</span>
      </div>
      <div className={flow.confirmRow}>
        <span className={flow.confirmKey}>時間</span>
        <span className={flow.confirmVal}>
          {startTime || "—"}
          {endTime ? ` 〜 ${endTime}` : ""}
        </span>
      </div>
      <div className={flow.confirmRow}>
        <span className={flow.confirmKey}>担当講師</span>
        <span className={flow.confirmVal}>{teacherName || "調整"}</span>
      </div>
      <div className={flow.confirmRow}>
        <span className={flow.confirmKey}>形式</span>
        <span className={flow.confirmVal}>{lessonDeliveryLabel(deliveryType)}</span>
      </div>
      <div className={flow.confirmRow}>
        <span className={flow.confirmKey}>所要時間</span>
        <span className={flow.confirmVal}>{durationMinutes != null ? `${durationMinutes}分` : "—"}</span>
      </div>
      <div className={flow.impactBox}>
        <div className={flow.impactTitle}>今回の予約で使う時間</div>
        <div className={flow.impactLine}>{useMinutes != null ? `${useMinutes}分` : "—"}</div>
        <div className={flow.impactTitle} style={{ marginTop: "0.45rem" }}>
          予約後の残り時間
        </div>
        <div className={flow.impactLine}>{afterMinutes != null ? `${afterMinutes}分` : "—"}</div>
      </div>
      <label className={flow.hint} style={{ display: "block", marginTop: "0.65rem" }}>
        <span style={{ display: "block", fontWeight: 700, marginBottom: "0.25rem", color: "#334155" }}>
          伝えたいこと（任意）
        </span>
        <input
          className={flow.field}
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="教室への連絡事項"
        />
      </label>
    </div>
  );
}

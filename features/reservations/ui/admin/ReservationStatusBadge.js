"use client";

import ui from "./reservation-detail-panel.module.css";

function statusLabel(status) {
  const s = String(status || "").trim();
  if (s === "confirmed") return "確定";
  if (s === "requested") return "仮予約";
  if (s === "change_requested" || s === "scheduled") return "要確認";
  if (s === "cancelled" || s === "rejected") return "キャンセル";
  if (s === "completed") return "完了";
  return s || "不明";
}

export default function ReservationStatusBadge({ status }) {
  const s = String(status || "").trim();
  const klass =
    s === "confirmed" || s === "completed"
      ? ui.ok
      : s === "requested"
        ? ui.pending
        : s === "change_requested" || s === "scheduled"
          ? ui.warn
          : ui.cancel;
  return <span className={`${ui.status} ${klass}`}>{statusLabel(status)}</span>;
}

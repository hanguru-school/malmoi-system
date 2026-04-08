"use client";

import ui from "./reservation-detail-panel.module.css";

function actionLabel(action) {
  const a = String(action || "").trim();
  const map = {
    created: "作成",
    admin_updated: "変更",
    admin_status_changed: "状態変更",
    admin_change_requested: "変更依頼",
    admin_cancelled: "キャンセル",
    admin_rejected: "却下",
    admin_attendance_marked: "出欠処理",
    teacher_updated: "先生更新",
    student_cancelled: "生徒キャンセル",
  };
  return map[a] || a || "更新";
}

export default function ReservationHistoryList({ items = [] }) {
  if (!items.length) return <p className={ui.historySub}>履歴はありません。</p>;
  return (
    <ul className={ui.historyList}>
      {items.map((h) => (
        <li key={`${h.id || h.at}-${h.action}`} className={ui.historyRow}>
          <div className={ui.historyTop}>
            {actionLabel(h.action)} / {h.actorRole || "-"} / {String(h.at || "").replace("T", " ").slice(0, 16)}
          </div>
          <div className={ui.historySub}>{h.summary || "—"}</div>
        </li>
      ))}
    </ul>
  );
}

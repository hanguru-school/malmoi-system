"use client";

import { useState } from "react";
import ui from "./reservation-detail-panel.module.css";

export default function ReservationCancelDialog({ open, reservation, onClose, onConfirm, busy = false }) {
  const [reason, setReason] = useState("");
  if (!open || !reservation) return null;
  return (
    <div className={ui.dialogBackdrop} role="dialog" aria-modal="true" aria-label="キャンセル確認">
      <div className={ui.dialog}>
        <h3 className={ui.title}>この予約をキャンセルしますか？</h3>
        <p className={ui.subline}>
          キャンセル規定に基づき、返還ポイントを自動計算します。対象: {reservation.date} {reservation.time} /{" "}
          {reservation.studentNameKanji || "—"}
        </p>
        <div className={ui.block}>
          <div className={ui.metaGrid}>
            <span className={ui.metaKey}>返還可否</span>
            <span className={ui.metaVal}>システム規定により自動判定</span>
            <span className={ui.metaKey}>手数料</span>
            <span className={ui.metaVal}>規定がある場合のみ自動差引</span>
          </div>
        </div>
        <label className={ui.label}>
          キャンセル理由（任意）
          <textarea className={ui.textArea} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className={ui.actionRow}>
          <button type="button" className={ui.btn} onClick={onClose} disabled={busy}>
            戻る
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnDanger}`}
            disabled={busy}
            onClick={() => onConfirm(reason)}
          >
            キャンセル確定
          </button>
        </div>
      </div>
    </div>
  );
}

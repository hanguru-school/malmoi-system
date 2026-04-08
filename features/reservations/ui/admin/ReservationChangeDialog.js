"use client";

import { useEffect, useMemo, useState } from "react";
import ui from "./reservation-detail-panel.module.css";

function slotLabel(slot, teachers) {
  const t = teachers.find((x) => String(x.id) === String(slot.instructorUserId));
  const tn = t?.displayName || t?.email || "講師未設定";
  return `${slot.date} ${String(slot.time || "").slice(0, 5)} / ${slot.durationMinutes || 60}分 / ${tn}`;
}

export default function ReservationChangeDialog({
  open,
  reservation,
  teachers = [],
  slots = [],
  busy = false,
  onClose,
  onConfirm,
}) {
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [delivery, setDelivery] = useState("in_person");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!open || !reservation) return;
    setDate(String(reservation.date || "").slice(0, 10));
    setSlotId(String(reservation.slotId || ""));
    setDelivery(String(reservation.lessonDeliveryType || "in_person"));
    setMemo(String(reservation.memo || ""));
  }, [open, reservation]);

  const daySlots = useMemo(
    () =>
      (slots || [])
        .filter((s) => String(s.date || "").slice(0, 10) === date)
        .sort((a, b) => `${a.time || ""}`.localeCompare(`${b.time || ""}`)),
    [slots, date]
  );

  const selectedSlot = daySlots.find((s) => String(s.id) === String(slotId));
  const oldPt = Number(reservation?.expectedPointsConsume || reservation?.pointsCharged || 0);
  const newPt = Number(oldPt);

  if (!open || !reservation) return null;
  return (
    <div className={ui.dialogBackdrop} role="dialog" aria-modal="true" aria-label="予約変更">
      <div className={ui.dialog}>
        <h3 className={ui.title}>予約変更</h3>
        <div className={ui.dialogGrid}>
          <label className={ui.label}>
            日付
            <input className={ui.field} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className={ui.label}>
            時間・講師（スロット）
            <select className={ui.field} value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              <option value="">現在の枠を維持</option>
              {daySlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {slotLabel(s, teachers)}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.label}>
            形式
            <select className={ui.field} value={delivery} onChange={(e) => setDelivery(e.target.value)}>
              <option value="in_person">対面</option>
              <option value="online">オンライン</option>
            </select>
          </label>
          <label className={ui.label}>
            レッスン
            <input className={ui.field} value={reservation.lessonServiceNameJa || "現在レッスン"} readOnly />
          </label>
        </div>
        <label className={ui.label}>
          メモ
          <textarea className={ui.textArea} value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
        <div className={ui.block}>
          <h4 className={ui.blockTitle}>変更前/変更後</h4>
          <div className={ui.metaGrid}>
            <span className={ui.metaKey}>変更前</span>
            <span className={ui.metaVal}>
              {reservation.date} {String(reservation.time || "").slice(0, 5)} / {reservation.instructorName || "—"}
            </span>
            <span className={ui.metaKey}>変更後</span>
            <span className={ui.metaVal}>
              {selectedSlot ? `${selectedSlot.date} ${String(selectedSlot.time || "").slice(0, 5)}` : `${date}（現行時間維持）`} /{" "}
              {selectedSlot ? slotLabel(selectedSlot, teachers).split(" / ").slice(2).join(" / ") : reservation.instructorName || "—"}
            </span>
            <span className={ui.metaKey}>消費ポイント差</span>
            <span className={ui.metaVal}>{newPt - oldPt >= 0 ? `+${newPt - oldPt}` : `${newPt - oldPt}`} pt</span>
            <span className={ui.metaKey}>変更後残高</span>
            <span className={ui.metaVal}>残時間/残ポイントは保存時に再計算</span>
          </div>
        </div>
        <div className={ui.actionRow}>
          <button type="button" className={ui.btn} onClick={onClose} disabled={busy}>
            閉じる
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={() => onConfirm({ date, slotId, lessonDeliveryType: delivery, memo })}
            disabled={busy}
          >
            変更を保存
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import ui from "./reservation-detail-panel.module.css";

export default function ReservationActionBar({
  reservation,
  onOpenChange,
  onOpenCancel,
  onSaveMemo,
  onOpenCreateForStudent,
  memoDraft,
  setMemoDraft,
  busy = false,
}) {
  if (!reservation) return null;
  return (
    <div className={`${ui.actions} ${ui.mobileSticky}`}>
      <div className={ui.actionRow}>
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={onOpenChange} disabled={busy}>
          変更
        </button>
        <button type="button" className={`${ui.btn} ${ui.btnDanger}`} onClick={onOpenCancel} disabled={busy}>
          キャンセル
        </button>
        <button type="button" className={ui.btn} disabled>
          削除（準備中）
        </button>
        <button type="button" className={ui.btn} onClick={onSaveMemo} disabled={busy}>
          メモ編集
        </button>
      </div>
      <textarea
        className={ui.textArea}
        value={memoDraft}
        onChange={(e) => setMemoDraft(e.target.value)}
        placeholder="予約メモ / 運用メモ / 管理メモ"
      />
      <div className={ui.actionRow}>
        <button type="button" className={ui.btn} onClick={onOpenCreateForStudent}>
          この学生で追加予約
        </button>
        <Link className={ui.btn} href={`/admin/students/${reservation.studentId}`}>
          学生詳細を見る
        </Link>
        <Link className={ui.btn} href={`/admin/reservations?ui=v2&date=${encodeURIComponent(reservation.date || "")}`}>
          詳細ページへ
        </Link>
        <Link
          className={ui.btn}
          href={
            reservation.lessonUnitId
              ? `/admin/lesson-notes?lessonUnitId=${encodeURIComponent(reservation.lessonUnitId)}`
              : "/admin/lesson-notes"
          }
        >
          レッスンノートへ
        </Link>
      </div>
      <div className={ui.actionRow}>
        <Link className={ui.btn} href="/admin/homeworks">
          宿題へ
        </Link>
        <Link
          className={ui.btn}
          href={`/admin/reservations?ui=v2&date=${encodeURIComponent(reservation.date || "")}&q=${encodeURIComponent(reservation.instructorName || "")}`}
        >
          講師スケジュールを見る
        </Link>
        <Link className={ui.btn} href={`/admin/reservations?ui=v2&date=${encodeURIComponent(reservation.date || "")}`}>
          同日の前後予定
        </Link>
      </div>
    </div>
  );
}

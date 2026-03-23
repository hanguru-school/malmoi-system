/**
 * 予約から「予約済み分」を合算する純粋関数（サーバー/クライアント共通）
 * 計算式は既存の学生 UI と同一。
 */

/** 予約終了時刻（ミリ秒）。パース不能なら null */
export function reservationEndTimestamp(reservation) {
  const dateStr = String(reservation?.date || "").trim();
  const timeStr = String(reservation?.time || "").trim();
  if (!dateStr || !timeStr) return null;
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const iso = `${dateStr}T${t}`;
  const start = Date.parse(iso);
  if (!Number.isFinite(start)) return null;
  const dur = Math.max(0, Number(reservation?.durationMinutes || 0));
  return start + dur * 60 * 1000;
}

/** 今後の予定として「予約済み」に数えるか */
export function isReservationCountingAsReserved(reservation) {
  const st = String(reservation?.status || "");
  if (st === "cancelled" || st === "completed") return false;
  if (st !== "requested" && st !== "confirmed") return false;
  const end = reservationEndTimestamp(reservation);
  if (end == null) return false;
  return end > Date.now();
}

/** 予約済み時間（分）の合計 */
export function sumReservedMinutesFromReservations(reservations) {
  if (!Array.isArray(reservations)) return 0;
  return reservations.filter(isReservationCountingAsReserved).reduce((sum, r) => {
    const dm = Number(r?.durationMinutes || 0);
    return sum + (Number.isFinite(dm) ? dm : 0);
  }, 0);
}

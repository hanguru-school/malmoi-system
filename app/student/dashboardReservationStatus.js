/** DBの status 値はそのまま。表示文言・トーンのみ（学生向け） */

export function studentReservationStatusLabel(status) {
  const s = String(status || "").trim();
  if (s === "requested") return "予約申請中";
  if (s === "confirmed") return "予約確定";
  if (s === "change_requested") return "変更確認中";
  if (s === "cancelled") return "キャンセル";
  if (s === "completed") return "受講完了";
  if (s === "rejected") return "却下";
  return s || "—";
}

/** CSS data-status 用 */
export function studentReservationStatusTone(status) {
  const s = String(status || "").trim();
  if (s === "confirmed") return "confirmed";
  if (s === "requested") return "requested";
  if (s === "change_requested") return "change_requested";
  if (s === "completed") return "completed";
  if (s === "cancelled") return "cancelled";
  if (s === "rejected") return "rejected";
  return "default";
}

/** 次の予約カード用：出席情報があれば補助ラベル（内部値は出さない） */
export function studentReservationStatusSubline(reservation) {
  const st = String(reservation?.status || "");
  const att = String(reservation?.attendanceStatus || "").trim();
  if (st === "completed") return "受講が完了しています";
  if (st === "confirmed" && att === "attended") return "来校・出席を確認済み";
  if (st === "confirmed" && (att === "no_show" || att === "absent")) return "欠席の記録があります";
  return null;
}

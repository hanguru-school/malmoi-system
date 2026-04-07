/**
 * 学生予約: API 応答・スロット表示用の純関数（副作用なし）
 */

export function statusMeta(status, attendanceStatus) {
  if (status === "requested") return { label: "予約申請中", tone: "pending" };
  if (status === "confirmed") return { label: "予約確定", tone: "confirmed" };
  if (status === "change_requested") return { label: "変更依頼", tone: "scheduled" };
  if (status === "rejected") return { label: "却下", tone: "cancelled" };
  if (status === "completed") return { label: "完了", tone: "completed" };
  if (status === "cancelled") return { label: "キャンセル", tone: "cancelled" };
  if (attendanceStatus === "attended") return { label: "出席", tone: "attended" };
  if (attendanceStatus === "no_show" || attendanceStatus === "absent") return { label: "欠席", tone: "absent" };
  if (attendanceStatus === "scheduled") return { label: "予定", tone: "scheduled" };
  return { label: status || "-", tone: "scheduled" };
}

export function lessonDeliveryLabel(type) {
  return type === "online" ? "オンラインレッスン" : "対面レッスン";
}

export function blockedText(code) {
  if (code === "cutoff_passed") return "締切時間を過ぎたため、直接処理できません。";
  if (code === "status_not_changeable") return "現在の状態では変更できません。";
  if (code === "status_not_cancellable") return "現在の状態ではキャンセルできません。";
  if (code === "attendance_locked") return "出席処理済みの予約は学生が直接変更/キャンセルできません。";
  return "";
}

export function slotLabel(slot) {
  const teacher = slot.instructorName ? ` / 担当 ${slot.instructorName}` : "";
  return `${slot.date} ${slot.time} / ${slot.durationMinutes}分${teacher}`;
}

export function toMinutes(time) {
  const [hh, mm] = String(time || "00:00")
    .split(":")
    .map((v) => Number(v || 0));
  return hh * 60 + mm;
}

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(value) {
  const [y, m, d] = String(value || "1970-01-01")
    .split("-")
    .map((v) => Number(v || 0));
  return new Date(y, (m || 1) - 1, d || 1);
}

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function buildStudentReservationCreatePayload(form) {
  return {
    slotId: String(form.slotId || "").trim(),
    lessonDeliveryType: form.lessonDeliveryType || "in_person",
    memo: String(form.memo || "").trim(),
  };
}

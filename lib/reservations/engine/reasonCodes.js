/**
 * 予約候補・不可理由の機械可読コード（API・UI 共通）
 */
export const ReasonCodes = {
  CLASSROOM_CLOSED: "classroom_closed",
  OUTSIDE_BUSINESS_HOURS: "outside_business_hours",
  CLASSROOM_BREAK: "classroom_break",
  TEACHER_UNAVAILABLE: "teacher_unavailable",
  TEACHER_BREAK: "teacher_break",
  INSUFFICIENT_DURATION_WINDOW: "insufficient_duration_window",
  SLOT_CLOSED: "slot_closed",
  POLICY_DEADLINE_PASSED: "policy_deadline_passed",
  POLICY_LEAD_TIME: "policy_lead_time",
  INSUFFICIENT_POINTS: "insufficient_points",
  INSUFFICIENT_MINUTES: "insufficient_minutes",
  RESERVATION_CONFLICT: "reservation_conflict",
  INSTRUCTOR_CONFLICT: "instructor_conflict",
  LESSON_NOT_SUPPORTED_BY_TEACHER: "lesson_not_supported_by_teacher",
  DELIVERY_MISMATCH: "delivery_mismatch",
  DURATION_MISMATCH: "duration_mismatch",
  CAPACITY_FULL: "capacity_full",
  SLOT_STARTED: "slot_started",
  LESSON_DISABLED: "lesson_disabled",
  TEACHER_FILTER_MISMATCH: "teacher_filter_mismatch",
  UNKNOWN: "unknown",
};

const JA = {
  [ReasonCodes.CLASSROOM_CLOSED]: "教室休業・営業外",
  [ReasonCodes.OUTSIDE_BUSINESS_HOURS]: "営業時間外",
  [ReasonCodes.CLASSROOM_BREAK]: "教室休憩時間帯",
  [ReasonCodes.TEACHER_UNAVAILABLE]: "講師の受付外",
  [ReasonCodes.TEACHER_BREAK]: "講師休憩（該当する場合）",
  [ReasonCodes.INSUFFICIENT_DURATION_WINDOW]: "必要時間を確保できません",
  [ReasonCodes.SLOT_CLOSED]: "スロット閉鎖",
  [ReasonCodes.POLICY_DEADLINE_PASSED]: "予約締切後",
  [ReasonCodes.POLICY_LEAD_TIME]: "最低準備時間を満たしません",
  [ReasonCodes.INSUFFICIENT_POINTS]: "ポイント残高不足",
  [ReasonCodes.INSUFFICIENT_MINUTES]: "レッスン時間残不足",
  [ReasonCodes.RESERVATION_CONFLICT]: "学生の同一時間帯予約あり",
  [ReasonCodes.INSTRUCTOR_CONFLICT]: "講師の重複予約あり",
  [ReasonCodes.LESSON_NOT_SUPPORTED_BY_TEACHER]: "対応講師ではありません",
  [ReasonCodes.DELIVERY_MISMATCH]: "レッスン形式不一致",
  [ReasonCodes.DURATION_MISMATCH]: "所要時間とスロット不一致",
  [ReasonCodes.CAPACITY_FULL]: "定員満了",
  [ReasonCodes.SLOT_STARTED]: "開始時刻経過",
  [ReasonCodes.LESSON_DISABLED]: "レッスン無効",
  [ReasonCodes.TEACHER_FILTER_MISMATCH]: "選択講師と枠の講師が不一致",
  [ReasonCodes.UNKNOWN]: "理由未分類",
};

export function explainUnavailableReason(code) {
  const c = String(code || "").trim();
  return JA[c] || JA[ReasonCodes.UNKNOWN];
}

/** 日本語メッセージからコードを推定（後方互換・ログ用） */
export function inferReasonCodeFromMessageJa(messageJa) {
  const s = String(messageJa || "");
  if (s.includes("教室休業") || s.includes("休業日")) return ReasonCodes.CLASSROOM_CLOSED;
  if (s.includes("営業時間外")) return ReasonCodes.OUTSIDE_BUSINESS_HOURS;
  if (s.includes("休憩時間")) return ReasonCodes.CLASSROOM_BREAK;
  if (s.includes("講師の受付外") || s.includes("受付時間外")) return ReasonCodes.TEACHER_UNAVAILABLE;
  if (s.includes("講師未設定")) return ReasonCodes.LESSON_NOT_SUPPORTED_BY_TEACHER;
  if (s.includes("閉じられ")) return ReasonCodes.SLOT_CLOSED;
  if (s.includes("開始時刻を過ぎ")) return ReasonCodes.SLOT_STARTED;
  if (s.includes("定員")) return ReasonCodes.CAPACITY_FULL;
  if (s.includes("一致しません") && s.includes("長さ")) return ReasonCodes.DURATION_MISMATCH;
  if (s.includes("形式")) return ReasonCodes.DELIVERY_MISMATCH;
  if (s.includes("同一時間帯")) return ReasonCodes.RESERVATION_CONFLICT;
  if (s.includes("別予約と時間が重なり")) return ReasonCodes.INSTRUCTOR_CONFLICT;
  if (s.includes("講師とスロットの講師")) return ReasonCodes.TEACHER_FILTER_MISMATCH;
  if (s.includes("無効")) return ReasonCodes.LESSON_DISABLED;
  if (s.includes("準備時間")) return ReasonCodes.POLICY_LEAD_TIME;
  if (s.includes("ポイント") && s.includes("不足")) return ReasonCodes.INSUFFICIENT_POINTS;
  if (s.includes("レッスン時間") && s.includes("不足")) return ReasonCodes.INSUFFICIENT_MINUTES;
  return ReasonCodes.UNKNOWN;
}

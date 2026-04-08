/**
 * 学生向け：エンジン reason code / 文言を短く分かりやすく（ポイントは伏せる）
 */

import { ReasonCodes } from "../reservations/engine/reasonCodes.js";

const BY_CODE = {
  [ReasonCodes.CLASSROOM_CLOSED]: "この日は休業です",
  [ReasonCodes.OUTSIDE_BUSINESS_HOURS]: "この時間は受付できません",
  [ReasonCodes.CLASSROOM_BREAK]: "休憩時間のため選べません",
  [ReasonCodes.TEACHER_UNAVAILABLE]: "対応可能な講師がいません",
  [ReasonCodes.TEACHER_BREAK]: "講師の休憩時間です",
  [ReasonCodes.INSUFFICIENT_DURATION_WINDOW]: "必要な時間を確保できません",
  [ReasonCodes.SLOT_CLOSED]: "この枠は閉じられています",
  [ReasonCodes.POLICY_DEADLINE_PASSED]: "受付終了しました",
  [ReasonCodes.POLICY_LEAD_TIME]: "準備時間が足りません",
  [ReasonCodes.INSUFFICIENT_POINTS]: "この枠は現在お選びいただけません",
  [ReasonCodes.INSUFFICIENT_MINUTES]: "残り時間が不足しています",
  [ReasonCodes.RESERVATION_CONFLICT]: "同じ時間に別の予約があります",
  [ReasonCodes.INSTRUCTOR_CONFLICT]: "講師の都合で選べません",
  [ReasonCodes.LESSON_NOT_SUPPORTED_BY_TEACHER]: "この講師ではこのレッスンを受けられません",
  [ReasonCodes.DELIVERY_MISMATCH]: "対面/オンラインの組み合わせが合いません",
  [ReasonCodes.DURATION_MISMATCH]: "枠の長さがレッスンと合いません",
  [ReasonCodes.CAPACITY_FULL]: "定員に達しています",
  [ReasonCodes.SLOT_STARTED]: "開始時刻を過ぎています",
  [ReasonCodes.LESSON_DISABLED]: "このレッスンは選べません",
  [ReasonCodes.TEACHER_FILTER_MISMATCH]: "講師の指定と枠が合いません",
  [ReasonCodes.UNKNOWN]: "この日は予約できません",
};

/**
 * @param {string[]} codes
 * @param {string[]} blockReasonsJa
 */
export function studentFacingUnavailableHint(codes = [], blockReasonsJa = []) {
  const list = Array.isArray(codes) ? codes : [];
  for (const c of list) {
    const key = String(c || "").trim();
    if (BY_CODE[key]) return BY_CODE[key];
  }
  const ja = Array.isArray(blockReasonsJa) ? blockReasonsJa.filter(Boolean) : [];
  if (ja.length) {
    const s = String(ja[0]);
    if (s.includes("ポイント")) return BY_CODE[ReasonCodes.INSUFFICIENT_POINTS];
    if (s.includes("レッスン時間") && s.includes("不足")) return BY_CODE[ReasonCodes.INSUFFICIENT_MINUTES];
    return s.length > 36 ? `${s.slice(0, 34)}…` : s;
  }
  return BY_CODE[ReasonCodes.UNKNOWN];
}

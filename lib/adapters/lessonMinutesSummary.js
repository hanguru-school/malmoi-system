/**
 * レッスン時間（残高・次回完了時の目安）— 学生/管理画面で共通利用する純粋ヘルパ
 * 永続化スキーマは変更しない。
 */

export function computeLessonMinutesBalance(studentLike) {
  const lm = studentLike?.lessonMinutes || {};
  const total = Math.max(0, Number(lm.totalMinutes ?? 0));
  const used = Math.max(0, Number(lm.usedMinutes ?? 0));
  const fromRemaining = Number(lm.remainingMinutes);
  const remaining = Number.isFinite(fromRemaining)
    ? Math.max(0, fromRemaining)
    : Math.max(0, total - used);
  return { totalMinutes: total, usedMinutes: used, remainingMinutes: remaining };
}

/**
 * 次の予約の所要分と残りの比較（完了時に usage 原簿へ載る前提の目安）
 */
export function buildLessonMinutesCompletionPreview({ remainingMinutes, nextReservation }) {
  const rem = Math.max(0, Number(remainingMinutes || 0));
  const st = String(nextReservation?.status || "");
  const nextDur =
    nextReservation && ["requested", "confirmed"].includes(st)
      ? Math.max(0, Number(nextReservation.durationMinutes || 0))
      : 0;
  const insufficient = nextDur > 0 && rem < nextDur;
  const shortfall = insufficient ? nextDur - rem : 0;
  let hintJa = null;
  if (nextDur > 0) {
    hintJa = insufficient
      ? `次のレッスン（${nextDur}分）に対し、残り時間が不足しています。教室へご相談ください。`
      : `レッスン完了時に約${nextDur}分が消費される予定です（予約の長さに基づく目安）。`;
  }
  return {
    remainingMinutes: rem,
    nextReservationDeductMinutes: nextDur,
    nextCompletionShortfallMinutes: shortfall,
    nextCompletionInsufficient: insufficient,
    completionHintJa: hintJa,
  };
}

export function lessonMinuteLedgerKindLabelJa(kind) {
  const k = String(kind || "");
  if (k === "topup") return "付与・購入";
  if (k === "usage") return "消費（受講）";
  if (k === "refund") return "返却";
  if (k === "manual_adjustment") return "手動調整";
  return k || "—";
}

/**
 * レッスン時間 — 原簿配列からの純粋集計（JSON スキーマの意味に合わせる）
 *
 * type 規約:
 * - charge: minutes は正の付与分
 * - usage: minutes は正の消費分（完了時）
 * - manual_adjustment: minutes は残りへの増減（符号付き）
 *
 * 残り = max(0, Σcharge − Σusage + Σmanual)
 */

export function summarizeLessonMinuteJournalEntries(entries) {
  let charge = 0;
  let usage = 0;
  let manual = 0;
  for (const e of entries || []) {
    const t = String(e?.type || "").trim();
    const m = Number(e?.minutes || 0);
    if (t === "charge") charge += Math.abs(m);
    else if (t === "usage") usage += Math.abs(m);
    else if (t === "manual_adjustment") manual += m;
  }
  const remainingMinutes = Math.max(0, charge - usage + manual);
  const usedMinutes = usage;
  const totalMinutes = usedMinutes + remainingMinutes;
  return {
    chargeSum: charge,
    usageSum: usage,
    manualSum: manual,
    remainingMinutes,
    usedMinutes,
    totalMinutes,
  };
}

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
  const projectedRemainingAfterNext =
    nextDur > 0 ? Math.max(0, rem - nextDur) : rem;
  let hintJa = null;
  let projectedHintJa = null;
  if (nextDur > 0) {
    hintJa = insufficient
      ? `次のレッスン（${nextDur}分）に対し、残り時間が不足しています。教室へご相談ください。`
      : `レッスン完了時に約${nextDur}分が消費される予定です（予約の長さに基づく目安）。`;
    projectedHintJa = `次回レッスン完了後の目安残り: 約${projectedRemainingAfterNext}分（現在の残りから予約時間を差し引いた参考値）。`;
  }
  return {
    remainingMinutes: rem,
    nextReservationDeductMinutes: nextDur,
    nextCompletionShortfallMinutes: shortfall,
    nextCompletionInsufficient: insufficient,
    projectedRemainingAfterNext,
    completionHintJa: hintJa,
    projectedRemainingHintJa: projectedHintJa,
  };
}

export function lessonMinuteJournalTypeLabelJa(type) {
  const t = String(type || "");
  if (t === "charge") return "付与・購入";
  if (t === "usage") return "消費（受講完了）";
  if (t === "manual_adjustment") return "手動調整・返却";
  return t || "—";
}

/**
 * 学生向けポータル用（内部メモは出さず、受講記録のトーンで短文）
 * @param {Record<string, string>} reservationHintById 例: { [reservationId]: "2025-04-02 10:00" }
 */
export function formatLessonMinuteJournalEntryForStudentPortal(entry, reservationHintById = {}) {
  if (!entry || typeof entry !== "object") return null;
  const t = String(entry.type || "");
  const m = Number(entry.minutes || 0);
  const abs = Math.abs(m);
  const when = String(entry.createdAt || "").replace("T", " ").slice(0, 19);
  const rid = entry.relatedReservationId ? String(entry.relatedReservationId) : "";
  const resHint = rid && reservationHintById[rid] ? reservationHintById[rid] : "";
  const subBase = resHint ? `${when} · ${resHint}` : when;
  if (t === "charge") {
    return {
      id: entry.id,
      at: entry.createdAt,
      kind: "charge",
      lineJa: `レッスン時間が ${abs}分 追加されました`,
      subJa: when,
    };
  }
  if (t === "usage") {
    return {
      id: entry.id,
      at: entry.createdAt,
      kind: "usage",
      lineJa: `レッスンで ${abs}分 使いました`,
      subJa: subBase,
    };
  }
  if (t === "manual_adjustment") {
    const lineJa =
      m >= 0
        ? `調整により レッスン時間が ${abs}分 増えました`
        : `調整により レッスン時間が ${abs}分 減りました`;
    return { id: entry.id, at: entry.createdAt, kind: "adjust", lineJa, subJa: when };
  }
  return null;
}

/** 旧 UI（lessonMinuteLedger）用ラベル */
export function lessonMinuteLedgerKindLabelJa(kind) {
  const k = String(kind || "");
  if (k === "topup") return "付与・購入";
  if (k === "usage") return "消費（受講）";
  if (k === "refund") return "返却";
  if (k === "manual_adjustment") return "手動調整";
  return k || "—";
}

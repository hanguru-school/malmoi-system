/**
 * MalMoi 決済計算（純粋関数）
 * 設定変更があっても過去取引の再計算に使わないこと。保存済み snapshot のみが正とする。
 */

export function getActivePointConversionRule(rules = []) {
  const list = Array.isArray(rules) ? rules : [];
  const active = list.find((r) => r && r.isActive !== false);
  return active || list[0] || { id: null, yenAmount: 1, points: 1, isActive: true };
}

export function getActivePointTimeRule(rules = []) {
  const list = Array.isArray(rules) ? rules : [];
  const active = list.find((r) => r && r.isActive !== false);
  return active || list[0] || { id: null, pointAmount: 1, minutes: 1, isActive: true };
}

/** 税込入力: amount は税込総額。税抜入力: amount は税抜額。 */
export function computeTaxAmounts(inputMode, inputAmountYen, taxRatePercent) {
  const mode = String(inputMode || "inclusive").toLowerCase() === "exclusive" ? "exclusive" : "inclusive";
  const raw = Math.max(0, Math.round(Number(inputAmountYen || 0)));
  const rate = Math.max(0, Number(taxRatePercent || 0)) / 100;
  if (mode === "inclusive") {
    const taxInclusive = raw;
    const taxExclusive = rate > 0 ? Math.round(taxInclusive / (1 + rate)) : taxInclusive;
    const taxAmount = taxInclusive - taxExclusive;
    return {
      taxInputMode: "inclusive",
      taxRatePercent: Number(taxRatePercent || 0),
      amountTaxExclusive: taxExclusive,
      taxAmount,
      amountTaxInclusive: taxInclusive,
    };
  }
  const taxExclusive = raw;
  const taxAmount = Math.round(taxExclusive * rate);
  const taxInclusive = taxExclusive + taxAmount;
  return {
    taxInputMode: "exclusive",
    taxRatePercent: Number(taxRatePercent || 0),
    amountTaxExclusive: taxExclusive,
    taxAmount,
    amountTaxInclusive: taxInclusive,
  };
}

export function computeBasePointsFromYen(taxExclusiveYen, baseRule) {
  const yen = Math.max(0, Math.floor(Number(taxExclusiveYen || 0)));
  const yenAmount = Math.max(1, Number(baseRule?.yenAmount || 1));
  const points = Math.max(1, Number(baseRule?.points || 1));
  return Math.floor(yen / yenAmount) * points;
}

/** 金額帯ボーナス: 税込金額が min 以上のティアのうち、最も高い min を満たす1件の bonus を採用 */
export function computeBonusPoints(amountTaxInclusive, tiers = [], atIso = null) {
  const amount = Math.max(0, Number(amountTaxInclusive || 0));
  const at = atIso ? new Date(atIso).getTime() : Date.now();
  const list = Array.isArray(tiers) ? tiers : [];
  const active = list.filter((t) => {
    if (!t || t.active === false) return false;
    if (t.effectiveFrom) {
      const ef = new Date(t.effectiveFrom).getTime();
      if (Number.isFinite(ef) && at < ef) return false;
    }
    return true;
  });
  const sorted = [...active].sort((a, b) => Number(b.minAmountInclusive || 0) - Number(a.minAmountInclusive || 0));
  for (const t of sorted) {
    if (amount >= Number(t.minAmountInclusive || 0)) {
      return Math.max(0, Math.floor(Number(t.bonusPoints || 0)));
    }
  }
  return 0;
}

export function computeGrantedMinutesFromPoints(finalPoints, timeRule) {
  const pts = Math.max(0, Math.floor(Number(finalPoints || 0)));
  const pointAmount = Math.max(1, Number(timeRule?.pointAmount || 1));
  const minutes = Math.max(1, Number(timeRule?.minutes || 1));
  return Math.floor(pts / pointAmount) * minutes;
}

/**
 * @param {object} opts
 * @returns {object} プレビュー結果（サーバー保存用フィールドと整合）
 */
export function buildPaymentCalculation(opts) {
  const {
    transactionKind = "payment",
    pointConversionRules = [],
    globalBonusTiers = [],
    taxRatePercent = 10,
    taxInputMode = "inclusive",
    inputAmountYen = 0,
    manualPoints = 0,
    manualReason = "",
    resolvedLayer = "basic",
    template = null,
  } = opts;

  const kind = String(transactionKind || "payment").trim() === "point_grant" ? "point_grant" : "payment";

  const baseConv = template
    ? {
        id: template.id || "template",
        yenAmount: Math.max(1, Number(template.baseYenAmount || 1)),
        points: Math.max(1, Number(template.basePoints || 1)),
        isActive: true,
      }
    : getActivePointConversionRule(pointConversionRules);

  const timeRule = template
    ? {
        id: template.id || "template",
        pointAmount: Math.max(1, Number(template.timePointAmount || 1)),
        minutes: Math.max(1, Number(template.timeMinutes || 1)),
        isActive: true,
      }
    : getActivePointTimeRule(opts.pointTimeConversionRules || []);

  const bonusTierSource = template && Array.isArray(template.bonusTiers) ? template.bonusTiers : globalBonusTiers;

  let tax = {
    taxInputMode: String(taxInputMode || "inclusive").toLowerCase() === "exclusive" ? "exclusive" : "inclusive",
    taxRatePercent: Number(taxRatePercent || 0),
    amountTaxExclusive: 0,
    taxAmount: 0,
    amountTaxInclusive: 0,
  };

  let basePoints = 0;
  let bonusPoints = 0;
  const manual = Math.max(0, Math.floor(Number(manualPoints || 0)));

  if (kind === "point_grant") {
    tax = {
      taxInputMode: tax.taxInputMode,
      taxRatePercent: tax.taxRatePercent,
      amountTaxExclusive: 0,
      taxAmount: 0,
      amountTaxInclusive: 0,
    };
    basePoints = 0;
    bonusPoints = 0;
  } else {
    tax = computeTaxAmounts(taxInputMode, inputAmountYen, taxRatePercent);
    basePoints = computeBasePointsFromYen(tax.amountTaxExclusive, baseConv);
    bonusPoints = computeBonusPoints(tax.amountTaxInclusive, bonusTierSource, opts.paidAtIso);
  }

  const finalPoints = basePoints + bonusPoints + manual;
  const grantedMinutes = computeGrantedMinutesFromPoints(finalPoints, timeRule);

  return {
    transactionKind: kind,
    appliedRuleType: resolvedLayer === "individual" ? "individual" : resolvedLayer === "bulk" ? "bulk" : "basic",
    basePoints,
    bonusPoints,
    manualPoints: manual,
    manualReason: String(manualReason || "").trim(),
    finalPoints,
    grantedMinutes,
    tax,
    baseConversionRule: {
      id: baseConv.id,
      yenAmount: baseConv.yenAmount,
      points: baseConv.points,
    },
    timeConversionRule: {
      id: timeRule.id,
      pointAmount: timeRule.pointAmount,
      minutes: timeRule.minutes,
    },
    bonusTiersSnapshot: (bonusTierSource || []).map((t) => ({
      id: t.id,
      minAmountInclusive: Number(t.minAmountInclusive || 0),
      bonusPoints: Number(t.bonusPoints || 0),
      active: t.active !== false,
      effectiveFrom: t.effectiveFrom || null,
      memo: String(t.memo || "").trim(),
    })),
  };
}

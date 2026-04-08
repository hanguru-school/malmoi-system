/**
 * MalMoi 運用ポリシー（表示・換算の単一ソース）
 * - 内部計算はポイント基準で統一する想定
 * - 1 円 = 1 ポイント
 * - 1 分 = 60 ポイント
 */

export const POINTS_PER_YEN = 1;
export const POINTS_PER_MINUTE = 60;

export function pointsForMinutes(minutes) {
  return Math.round(Math.max(0, Number(minutes) || 0) * POINTS_PER_MINUTE);
}

/** 保有ポイントを「参考の分数」に換算（切り捨て） */
export function referenceMinutesFromPoints(points) {
  return Math.floor(Math.max(0, Number(points) || 0) / POINTS_PER_MINUTE);
}

export function pointsForYen(yen) {
  return Math.round(Math.max(0, Number(yen) || 0) * POINTS_PER_YEN);
}

export const POINTS_POLICY_SUMMARY_JA =
  "教室の基本換算：1分＝60ポイント、購入時は1円＝1ポイント（キャンペーン等で上乗せがある場合は決済記録が優先されます）。";

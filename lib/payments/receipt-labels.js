/**
 * 保存済み PaymentTransaction から表示用ラベルのみ生成（再計算しない）
 */

export function jpTransactionKind(tx) {
  const k = String(tx?.transactionKind || "").trim();
  if (k === "point_grant") return "ポイント付与";
  if (k === "adjustment") return "調整";
  return "決済";
}

export function jpAppliedRuleType(tx) {
  const v = String(tx?.appliedRuleType || "").trim();
  if (v === "individual") return "個別ルール";
  if (v === "bulk") return "一括ルール";
  if (v === "basic") return "基本ルール";
  return "—";
}

/** 内部ステータス値を日本語表示（英字そのまま出さない） */
export function jpPaymentStatus(tx) {
  const s = String(tx?.status || "").trim();
  if (s === "completed") return "完了";
  if (s === "pending") return "未確定";
  if (s === "cancelled" || s === "canceled") return "取消";
  if (s === "refunded") return "返金";
  if (s === "failed") return "失敗";
  return s ? "その他" : "—";
}

/**
 * 学生向け一覧の区分（ルール種別は出さない）
 * 決済 / ポイント付与 / 調整
 */
export function jpStudentPaymentCategory(tx) {
  const k = String(tx?.transactionKind || "").trim();
  if (k === "adjustment") {
    const sub = String(tx?.adjustmentSubtype || "").trim();
    if (sub === "reversal") return "取消・相殺";
    return "調整";
  }
  if (k === "payment") return "決済";
  if (k === "point_grant") {
    const c = String(tx?.pointGrantCategory || "").trim();
    if (c === "調整") return "調整";
    return "ポイント付与";
  }
  return "—";
}

export function formatYen(n) {
  return `${new Intl.NumberFormat("ja-JP").format(Math.round(Number(n) || 0))}円`;
}

export function classroomDisplayName() {
  return String(process.env.CLASSROOM_DISPLAY_NAME || process.env.NEXT_PUBLIC_CLASSROOM_NAME || "MalMoi 韓国語教室").trim();
}

/**
 * 領収・メールフッター用の連絡先（メールアドレス表記のみ。外部メッセンジャーは使用しない）
 */
export function classroomContactFooterText() {
  const email = String(process.env.CLASSROOM_CONTACT_EMAIL || "office@hanguru.school").trim();
  return email ? `お問い合わせ: ${email}` : "";
}

export function officeInboxEmail() {
  return String(process.env.PAYMENT_OFFICE_EMAIL || "office@hanguru.school").trim();
}

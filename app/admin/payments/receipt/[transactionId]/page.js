import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "../../../../login/login.module.css";
import adminStyles from "../../../admin.module.css";
import receiptDoc from "../receipt-doc.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getPaymentTransactionByIdForAdmin } from "../../../../../lib/auth/store";
import {
  classroomContactFooterText,
  classroomDisplayName,
  formatYen,
  jpAppliedRuleType,
  jpTransactionKind,
} from "../../../../../lib/payments/receipt-labels.js";
import ReceiptToolbar from "../ReceiptToolbar";

function Row({ label, children }) {
  return (
    <div className={receiptDoc.row}>
      <span className={receiptDoc.rowLabel}>{label}</span>
      <span className={receiptDoc.rowVal}>{children}</span>
    </div>
  );
}

export default async function PaymentReceiptPage({ searchParams, params }) {
  await requireRole(["admin"]);
  const { transactionId } = await params;
  const sp = await searchParams;
  const tx = await getPaymentTransactionByIdForAdmin(transactionId);
  if (!tx) notFound();
  const kind = String(sp?.kind || "receipt").trim() === "ryoshu" ? "ryoshu" : "receipt";
  const addressName = String(sp?.name || "").trim() || tx.studentNameSnapshot || "御中";
  const purpose = String(sp?.purpose || "レッスン料として").trim();
  const issued = String(tx.registeredAt || "").slice(0, 10);
  const room = classroomDisplayName();
  const contact = classroomContactFooterText();

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <ReceiptToolbar transactionId={transactionId} />
        <div className={`receipt-print-area ${receiptDoc.shell}`}>
          <div className={receiptDoc.paper}>
            <h1 className={receiptDoc.title}>{kind === "ryoshu" ? "領収書" : "レシート"}</h1>
            <p className={receiptDoc.sub}>{room}</p>

            {kind === "ryoshu" ? (
              <>
                <Row label="発行日">{issued}</Row>
                <Row label="宛名">{addressName}</Row>
                <p className={receiptDoc.ryoshuAmount}>{formatYen(tx.amountTaxInclusive)}</p>
                <Row label="但し書き">{purpose}</Row>
              </>
            ) : (
              <>
                <Row label="発行日">{issued}</Row>
                <Row label="決済日時">{String(tx.paidAt || "").replace("T", " ").slice(0, 16)}</Row>
              </>
            )}

            <Row label="決済ID">{tx.id}</Row>
            <Row label="学生名">{tx.studentNameSnapshot}</Row>
            <Row label="会員番号">{tx.studentNumberSnapshot || "—"}</Row>
            <Row label="区分">{jpTransactionKind(tx)}</Row>
            <Row label="税抜金額">{formatYen(tx.amountTaxExclusive)}</Row>
            <Row label="消費税">{formatYen(tx.taxAmount)}（税率 {tx.taxRatePercent ?? 0}%）</Row>
            <Row label="税込金額">{formatYen(tx.amountTaxInclusive)}</Row>
            <Row label="お支払い方法">{tx.paymentMethod || "—"}</Row>
            <Row label="付与ポイント">{tx.finalPoints ?? 0} pt</Row>
            <Row label="換算時間（今回）">{tx.grantedMinutes ?? 0} 分</Row>
            {kind === "receipt" ? <Row label="適用ルール">{jpAppliedRuleType(tx)}</Row> : null}
            {tx.note ? (
              <Row label="備考">
                <span style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{tx.note}</span>
              </Row>
            ) : null}

            <p className={receiptDoc.note}>
              本書は保存済みの決済データから出力しています（再計算は行っていません）。
            </p>

            {kind === "ryoshu" ? (
              <div className={receiptDoc.issuer}>
                <strong>{room}</strong>
                <br />
                {contact}
              </div>
            ) : null}
          </div>
        </div>
        <p className={styles.description}>表示切替:</p>
        <p className={styles.description}>
          <Link
            className={adminStyles.inlineLink}
            href={`/admin/payments/receipt/${transactionId}?kind=receipt`}
          >
            レシート
          </Link>
          {" · "}
          <Link
            className={adminStyles.inlineLink}
            href={`/admin/payments/receipt/${transactionId}?kind=ryoshu&name=${encodeURIComponent(addressName)}&purpose=${encodeURIComponent(purpose)}`}
          >
            領収書
          </Link>
        </p>
      </main>
    </div>
  );
}

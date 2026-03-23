import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../login/login.module.css";
import adminStyles from "../../../admin.module.css";
import receiptDoc from "../../receipt/receipt-doc.module.css";
import payStyles from "../../admin.payments.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getPaymentTransactionAdminExtras, getPaymentTransactionByIdForAdmin } from "../../../../../lib/auth/store";
import {
  formatYen,
  jpAppliedRuleType,
  jpPaymentStatus,
  jpStudentPaymentCategory,
  jpTransactionKind,
} from "../../../../../lib/payments/receipt-labels.js";
import AdminTopNav from "../../../AdminTopNav";
import ReceiptToolbar from "../../receipt/ReceiptToolbar";
import PaymentTransactionResendClient from "../PaymentTransactionResendClient";
import PaymentTransactionSoftCancelClient from "../PaymentTransactionSoftCancelClient";

function Row({ label, children }) {
  return (
    <div className={receiptDoc.row}>
      <span className={receiptDoc.rowLabel}>{label}</span>
      <span className={receiptDoc.rowVal}>{children}</span>
    </div>
  );
}

function fmtDt(iso) {
  if (!iso) return "—";
  return String(iso).replace("T", " ").slice(0, 19);
}

export default async function AdminPaymentTransactionDetailPage({ params }) {
  await requireRole(["admin"]);
  const { transactionId } = await params;
  const [tx, extras] = await Promise.all([
    getPaymentTransactionByIdForAdmin(transactionId),
    getPaymentTransactionAdminExtras(transactionId),
  ]);
  if (!tx) notFound();

  const issued = String(tx.registeredAt || "").slice(0, 10);
  const mailDispatch = extras?.completionLog?.mailDispatch || null;
  const studentSent = Boolean(mailDispatch?.studentSent);
  const officeSent = Boolean(mailDispatch?.officeSent);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <div className={payStyles.statPageHead}>
          <div>
            <h1 className={styles.sectionTitle}>決済詳細</h1>
            <p className={payStyles.statLead}>保存済みデータの追跡・レシート/領収書・メール再送（読み取り専用・再計算なし）。</p>
          </div>
          <Link href="/admin/payments/input" className={payStyles.statHeadLink}>
            決済管理へ
          </Link>
        </div>
        <AdminTopNav currentPath="/admin/payments/input" />

        {/* 上部サマリー */}
        <div className={payStyles.txSummaryGrid}>
          <article className={payStyles.txSummaryCard}>
            <h2 className={payStyles.txSummaryLab}>学生名</h2>
            <p className={payStyles.txSummaryVal}>{tx.studentNameSnapshot}</p>
            <p className={payStyles.txSummarySub}>会員番号 {tx.studentNumberSnapshot || "—"}</p>
          </article>
          <article className={payStyles.txSummaryCard}>
            <h2 className={payStyles.txSummaryLab}>決済ID</h2>
            <p className={payStyles.txSummaryValSm}>{tx.id}</p>
          </article>
          <article className={payStyles.txSummaryCard}>
            <h2 className={payStyles.txSummaryLab}>決済日時</h2>
            <p className={payStyles.txSummaryValSm}>{fmtDt(tx.paidAt).slice(0, 16)}</p>
          </article>
          <article className={payStyles.txSummaryCard}>
            <h2 className={payStyles.txSummaryLab}>区分 / ステータス</h2>
            <p className={payStyles.txSummaryVal}>
              {jpStudentPaymentCategory(tx)} / {jpPaymentStatus(tx)}
            </p>
          </article>
          {extras?.studentCurrent ? (
            <>
              <article className={payStyles.txSummaryCard}>
                <h2 className={payStyles.txSummaryLab}>現在ポイント（参照）</h2>
                <p className={payStyles.txSummaryVal}>{extras.studentCurrent.pointsBalance} pt</p>
              </article>
              <article className={payStyles.txSummaryCard}>
                <h2 className={payStyles.txSummaryLab}>現在残り時間（参照）</h2>
                <p className={payStyles.txSummaryVal}>{extras.studentCurrent.remainingMinutes} 分</p>
              </article>
            </>
          ) : null}
        </div>

        <p className={adminStyles.smallMuted} style={{ marginBottom: "0.75rem" }}>
          <Link className={adminStyles.inlineLink} href={`/admin/students/${tx.studentId}`}>
            学生プロフィールへ
          </Link>
        </p>

        <ReceiptToolbar transactionId={transactionId} />

        {/* 通知・発行状態 */}
        <section className={payStyles.cardBlock}>
          <h2 className={payStyles.cardBlockTitle}>通知・発行状態</h2>
          <p className={payStyles.payHint} style={{ marginTop: 0 }}>
            完了ログがある取引のみ「送信済み」と表示します。メール未設定の環境ではログのみの場合があります。
          </p>
          <div className={receiptDoc.shell} style={{ maxWidth: 560 }}>
            <Row label="学生メール">{studentSent ? "送信済み" : "未送信/ログなし"}</Row>
            <Row label="教室メール">{officeSent ? "送信済み" : "未送信/ログなし"}</Row>
            <Row label="レシート表示">利用可（保存データベース）</Row>
            <Row label="領収書（Web）">利用可（保存データベース）</Row>
            <Row label="領収書PDF発行記録">{tx.ryoshuIssuedAt ? fmtDt(tx.ryoshuIssuedAt) : "記録なし"}</Row>
            <Row label="レシートPDF発行記録">{tx.receiptIssuedAt ? fmtDt(tx.receiptIssuedAt) : "記録なし"}</Row>
          </div>
        </section>

        <section className={payStyles.cardBlock}>
          <h2 className={payStyles.cardBlockTitle}>金額情報</h2>
          <div className={receiptDoc.shell} style={{ maxWidth: 560 }}>
            <Row label="税抜金額">{formatYen(tx.amountTaxExclusive)}</Row>
            <Row label="消費税">{formatYen(tx.taxAmount)}</Row>
            <Row label="税率">{tx.taxRatePercent ?? 0}%</Row>
            <Row label="税込金額">{formatYen(tx.amountTaxInclusive)}</Row>
            <Row label="お支払い方法">{tx.paymentMethod || "—"}</Row>
          </div>
        </section>

        <section className={payStyles.cardBlock}>
          <h2 className={payStyles.cardBlockTitle}>ポイント・時間</h2>
          <p className={payStyles.payHint} style={{ marginTop: 0 }}>
            この決済結果は保存時点のルールで確定されています（再計算していません）。
          </p>
          <div className={receiptDoc.shell} style={{ maxWidth: 560 }}>
            <Row label="適用ルール種別">{jpAppliedRuleType(tx)}</Row>
            <Row label="基本付与ポイント">{tx.basePoints ?? 0} pt</Row>
            <Row label="ボーナスポイント">{tx.bonusPoints ?? 0} pt</Row>
            <Row label="追加ポイント">{tx.manualPoints ?? 0} pt</Row>
            {tx.manualReason ? (
              <Row label="追加理由">
                <span style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{tx.manualReason}</span>
              </Row>
            ) : null}
            <Row label="合計付与ポイント">{tx.finalPoints ?? 0} pt</Row>
            <Row label="換算時間">{tx.grantedMinutes ?? 0} 分</Row>
          </div>
        </section>

        <section className={payStyles.cardBlock}>
          <h2 className={payStyles.cardBlockTitle}>取引メタ情報</h2>
          <div className={receiptDoc.shell} style={{ maxWidth: 560 }}>
            <Row label="決済ID">{tx.id}</Row>
            <Row label="ステータス">{jpPaymentStatus(tx)}</Row>
            <Row label="区分（内部種別）">{jpTransactionKind(tx)}</Row>
            {tx.pointGrantCategory ? <Row label="付与区分">{tx.pointGrantCategory}</Row> : null}
            <Row label="登録日時">{fmtDt(tx.registeredAt)}</Row>
            <Row label="発行日（参考）">{issued}</Row>
          </div>
        </section>

        <section className={payStyles.cardBlock}>
          <h2 className={payStyles.cardBlockTitle}>運用情報</h2>
          <div className={receiptDoc.shell} style={{ maxWidth: 560 }}>
            <Row label="登録者（アカウント）">{extras?.registeredByLabel || "—"}</Row>
            <Row label="作成日時（完了ログ）">{extras?.completionLog?.createdAt ? fmtDt(extras.completionLog.createdAt) : "—"}</Row>
            {extras?.completionLog?.frozenSnapshot ? (
              <Row label="完了時スナップショット">
                ポイント後 {extras.completionLog.frozenSnapshot.studentPointsAfter ?? "—"} pt / 残り時間{" "}
                {extras.completionLog.frozenSnapshot.studentRemainingMinutesAfter ?? "—"} 分
              </Row>
            ) : null}
            {tx.note ? (
              <Row label="備考">
                <span style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{tx.note}</span>
              </Row>
            ) : (
              <Row label="備考">—</Row>
            )}
          </div>
        </section>

        <p className={styles.description} style={{ marginTop: "1rem" }}>
          <Link className={adminStyles.inlineLink} href={`/admin/payments/receipt/${transactionId}?kind=receipt`}>
            レシートを全画面表示
          </Link>
          {" · "}
          <Link className={adminStyles.inlineLink} href={`/admin/payments/receipt/${transactionId}?kind=ryoshu`}>
            領収書を全画面表示
          </Link>
        </p>

        <PaymentTransactionResendClient transactionId={transactionId} />
        <PaymentTransactionSoftCancelClient transactionId={transactionId} currentStatus={jpPaymentStatus(tx)} />
      </main>
    </div>
  );
}

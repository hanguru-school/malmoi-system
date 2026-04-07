import Link from "next/link";
import { requireRole } from "../../../../lib/auth/session";
import { getPaymentTransactionForStudentPortal } from "../../../../lib/auth/store";
import StudentAreaLayout from "../../StudentAreaLayout";
import styles from "../../student.module.css";
import spStyles from "../student-payments.module.css";
import { classroomContactFooterText, classroomDisplayName, formatYen } from "../../../../lib/payments/receipt-labels";
import StudentPaymentDetailClient from "./StudentPaymentDetailClient";

export default async function StudentPaymentDetailPage({ params }) {
  const session = await requireRole(["student"]);
  const { transactionId } = await params;
  const tx = await getPaymentTransactionForStudentPortal(session.user.id, transactionId);
  if (!tx) {
    return (
      <StudentAreaLayout title="決済詳細" subtitle="">
        <p className={styles.card}>該当する決済が見つかりません。</p>
        <Link href="/student/payments">一覧へ戻る</Link>
      </StudentAreaLayout>
    );
  }

  const paidAtLabel = String(tx.paidAt || "").replace("T", " ").slice(0, 16);
  const issuedDateLabel = String(tx.registeredAt || "").slice(0, 10) || "—";

  const txView = {
    id: tx.id,
    paidAtLabel,
    amountTaxInclusiveLabel: formatYen(tx.amountTaxInclusive),
    paymentMethod: tx.paymentMethod || "",
    finalPoints: Number(tx.finalPoints ?? 0),
    grantedMinutes: Number(tx.grantedMinutes ?? 0),
    issuedDateLabel,
    classroomName: classroomDisplayName(),
    contactFooterText: classroomContactFooterText(),
  };

  return (
    <StudentAreaLayout title="お支払いの内容" subtitle="保存済みの記録です。">
      <div className={`${styles.card} ${spStyles.printHidden}`} style={{ padding: "0.85rem 0", border: "none", boxShadow: "none" }}>
        <Link href="/student/payments" style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--student-accent, #2563eb)" }}>
          ← 決済履歴へ
        </Link>
      </div>

      <div className={styles.card} style={{ padding: "1rem 1.1rem", maxWidth: 480 }}>
        <StudentPaymentDetailClient txView={txView} />
      </div>

      {/* 印刷時は領収書シートのみ（モーダル内と同じ id 領域を印刷対象にするため、クライアント側で表示中のみ存在） */}
    </StudentAreaLayout>
  );
}

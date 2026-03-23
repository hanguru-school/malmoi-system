"use client";

import Link from "next/link";
import adminStyles from "../../admin.module.css";

export default function ReceiptToolbar({ transactionId }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <button type="button" className={adminStyles.actionButton} onClick={() => window.print()}>
        印刷
      </button>
      <a
        className={adminStyles.actionButton}
        href={`/api/admin/payments/receipt/${transactionId}/pdf`}
        download
        style={{ textDecoration: "none" }}
      >
        PDF（レシート）
      </a>
      <a
        className={adminStyles.actionButton}
        href={`/api/admin/payments/receipt/${transactionId}/pdf?kind=ryoshu`}
        download
        style={{ textDecoration: "none" }}
      >
        PDF（領収書）
      </a>
      <Link className={adminStyles.inlineLink} href={`/admin/payments/receipt/${transactionId}?kind=receipt`}>
        レシート画面
      </Link>
      <Link
        className={adminStyles.inlineLink}
        href={`/admin/payments/receipt/${transactionId}?kind=ryoshu`}
      >
        領収書画面
      </Link>
      <Link href="/admin/payments/input" className={adminStyles.inlineLink}>
        決済管理へ戻る
      </Link>
    </div>
  );
}

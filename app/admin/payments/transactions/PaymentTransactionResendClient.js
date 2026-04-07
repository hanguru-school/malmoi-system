"use client";

import { useState } from "react";
import payStyles from "../admin.payments.module.css";

export default function PaymentTransactionResendClient({ transactionId }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function resend(scope) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/payments/transactions/${encodeURIComponent(transactionId)}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "再送に失敗しました。");
      setMsg(
        scope === "student"
          ? "学生向けメールを再送しました。"
          : scope === "office"
            ? "教室向け記録メールを再送しました。"
            : "学生・教室の両方に再送しました。",
      );
    } catch (e) {
      setMsg(e.message || "エラー");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={payStyles.cardBlock} style={{ marginTop: "1rem" }}>
      <h2 className={payStyles.cardBlockTitle}>メール再送</h2>
      <p className={payStyles.payHint} style={{ marginTop: 0 }}>
        保存済みの決済結果を読み取って送信します（再計算・データ変更は行いません）。
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button type="button" className={payStyles.completionSecondary} disabled={busy} onClick={() => resend("student")}>
          {busy ? "送信中…" : "学生にメール再送"}
        </button>
        <button type="button" className={payStyles.completionSecondary} disabled={busy} onClick={() => resend("office")}>
          {busy ? "送信中…" : "教室に記録メール再送"}
        </button>
        <button type="button" className={payStyles.completionSecondary} disabled={busy} onClick={() => resend("both")}>
          {busy ? "送信中…" : "両方まとめて再送"}
        </button>
      </div>
      {msg ? (
        <p className={msg.includes("再送") || msg.includes("送信") ? payStyles.msgOk : payStyles.msgErr} style={{ marginTop: "0.65rem" }} role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}

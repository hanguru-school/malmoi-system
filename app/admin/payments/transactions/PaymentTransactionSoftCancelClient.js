"use client";

import { useState } from "react";
import payStyles from "../admin.payments.module.css";

export default function PaymentTransactionSoftCancelClient({ transactionId, currentStatus }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submitSoftCancel() {
    const why = String(reason || "").trim();
    if (!why) {
      setMsg("取消理由を入力してください。");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/payments/transactions/${encodeURIComponent(transactionId)}/soft-cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: why }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "取消に失敗しました。");
      setMsg("取引を取消状態に変更しました。イベントログに記録済みです。");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (e) {
      setMsg(e.message || "エラー");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={payStyles.cardBlock} style={{ marginTop: "1rem" }}>
      <h2 className={payStyles.cardBlockTitle}>取引の取消（Soft Cancel）</h2>
      <p className={payStyles.payHint} style={{ marginTop: 0 }}>
        データ削除は行わず、ステータスを取消に変更し、取消イベントを追加します。
      </p>
      <p className={payStyles.payHint} style={{ marginTop: "0.2rem" }}>
        現在ステータス: <strong>{currentStatus || "-"}</strong>
      </p>
      <textarea
        className={payStyles.noteArea}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="取消理由（必須）"
        disabled={busy}
      />
      <div className={payStyles.submitRow}>
        <button type="button" className={payStyles.completionSecondary} onClick={submitSoftCancel} disabled={busy}>
          {busy ? "取消処理中…" : "取消状態へ変更"}
        </button>
      </div>
      {msg ? (
        <p className={msg.includes("変更") || msg.includes("記録") ? payStyles.msgOk : payStyles.msgErr} role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export default function AdminPendingApprovalPanel({ items = [] }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState("");
  const [errorText, setErrorText] = useState("");

  async function updateStatus(id, status) {
    setUpdatingId(id);
    setErrorText("");
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "予約状態の更新に失敗しました。");
      }
      router.refresh();
    } catch (error) {
      setErrorText(error?.message || "予約状態の更新中にエラーが発生しました。");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className={styles.pendingQueueWrap}>
      {items.map((item) => (
        <article key={item.id} className={styles.pendingQueueCard}>
          <p className={styles.pendingQueueTitle}>
            {item.date} {item.time} / {item.studentNameKanji || "-"}
          </p>
          <p className={styles.smallMuted}>
            {item.lessonDeliveryType === "online" ? "オンライン" : "対面"} / {item.instructorName || "講師未設定"}
          </p>
          <div className={styles.pendingQueueActions}>
            <button
              className={styles.pendingApproveButton}
              type="button"
              disabled={updatingId === item.id}
              onClick={() => updateStatus(item.id, "confirmed")}
            >
              承認
            </button>
            <button
              className={styles.pendingChangeButton}
              type="button"
              disabled={updatingId === item.id}
              onClick={() => updateStatus(item.id, "change_requested")}
            >
              変更依頼
            </button>
            <button
              className={styles.pendingRejectButton}
              type="button"
              disabled={updatingId === item.id}
              onClick={() => updateStatus(item.id, "rejected")}
            >
              却下
            </button>
            <a className={styles.inlineLink} href={`/admin/reservations?date=${encodeURIComponent(item.date)}&status=requested`}>
              詳細へ
            </a>
          </div>
        </article>
      ))}
      {items.length === 0 ? <p className={styles.smallMuted}>承認待ち予約はありません。</p> : null}
      {errorText ? <p className={styles.smallMuted}>{errorText}</p> : null}
    </div>
  );
}

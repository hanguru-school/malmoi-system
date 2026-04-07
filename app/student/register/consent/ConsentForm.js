"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../login/login.module.css";
import { registrationProfilePath } from "../../../../lib/student/registrationNavPaths";

export default function ConsentForm({ registrationUi }) {
  const router = useRouter();
  const [checkedPolicy, setCheckedPolicy] = useState(false);
  const [checkedEnrollment, setCheckedEnrollment] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!checkedPolicy || !checkedEnrollment) {
      setStatus({ type: "error", text: "教室規定と入会同意を確認してください。" });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch("/api/student/consent", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "同意処理に失敗しました。");
      router.push(registrationProfilePath(registrationUi));
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "処理中にエラーが発生しました。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className={styles.label}>
        <input type="checkbox" checked={checkedPolicy} onChange={(e) => setCheckedPolicy(e.target.checked)} /> 教室規定に同意します
      </label>
      <label className={styles.label}>
        <input
          type="checkbox"
          checked={checkedEnrollment}
          onChange={(e) => setCheckedEnrollment(e.target.checked)}
        />{" "}
        入会に同意します
      </label>
      <button className={styles.button} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "処理中..." : "同意して次へ進む"}
      </button>
      {status.text ? <p className={`${styles.message} ${styles.messageError}`}>{status.text}</p> : null}
    </form>
  );
}

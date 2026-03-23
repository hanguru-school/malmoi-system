"use client";

import { useState } from "react";
import styles from "../../login/login.module.css";

export default function PasswordChangeRequiredForm() {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
          requireCurrentPassword: false,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "変更に失敗しました。");
      setStatus({ type: "ok", text: "パスワードを変更しました。ホームへ移動します。" });
      window.setTimeout(() => {
        window.location.href = "/login/next";
      }, 600);
    } catch (error) {
      setStatus({ type: "error", text: error.message || "変更中にエラーが発生しました。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>パスワード変更</h1>
        <p className={styles.description}>初回ログインのため、先に新しいパスワードを設定してください。</p>
        <form onSubmit={submit}>
          <label className={styles.label}>
            新しいパスワード
            <input
              className={styles.field}
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              required
            />
          </label>
          <label className={styles.label}>
            新しいパスワード（確認）
            <input
              className={styles.field}
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </label>

          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "変更中..." : "変更する"}
          </button>
        </form>

        {status.text ? (
          <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
            {status.text}
          </p>
        ) : null}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import styles from "../../login/login.module.css";

export default function PasswordResetRequestPage() {
  const [form, setForm] = useState({ nameKanji: "", phone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "確認メール送信に失敗しました。");
      setStatus({ type: "ok", text: "確認メールを送信しました。メールをご確認ください。" });
    } catch (error) {
      setStatus({ type: "error", text: error.message || "入力情報を確認してください。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>パスワード再設定</h1>
        <p className={styles.description}>登録情報を入力してください。</p>
        <form onSubmit={submit}>
          <label className={styles.label}>
            学生氏名
            <input
              className={styles.field}
              value={form.nameKanji}
              onChange={(e) => setForm((prev) => ({ ...prev, nameKanji: e.target.value }))}
              required
            />
          </label>
          <label className={styles.label}>
            電話番号
            <input
              className={styles.field}
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              required
            />
          </label>
          <label className={styles.label}>
            メールアドレス
            <input
              className={styles.field}
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>

          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "確認メールを送信"}
          </button>
        </form>

        {status.text ? (
          <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
            {status.text}
          </p>
        ) : null}

        <div className={styles.links}>
          <a className={styles.link} href="/login">ログインへ戻る</a>
        </div>
      </main>
    </div>
  );
}

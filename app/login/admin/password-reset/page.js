"use client";

import { useState } from "react";
import styles from "../../login.module.css";

export default function AdminPasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/admin-password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "送信に失敗しました。しばらくしてから再度お試しください。");
      }
      setStatus({
        type: "ok",
        text:
          data.message ||
          "入力されたメールアドレス宛に、再設定方法を送信しました。届かない場合は迷惑メールフォルダもご確認ください。",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text: error.message || "送信に失敗しました。しばらくしてから再度お試しください。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>管理者パスワード再設定</h1>
        <p className={styles.description}>
          登録済みの管理者メールアドレスを入力してください。再設定用のリンクをメールでお送りします。
        </p>
        <form onSubmit={submit}>
          <label className={styles.label}>
            メールアドレス
            <input
              className={styles.field}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "再設定メールを送信"}
          </button>
        </form>

        {status.text ? (
          <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
            {status.text}
          </p>
        ) : null}

        <div className={styles.links}>
          <a className={styles.link} href="/login/admin">
            管理者ログインへ戻る
          </a>
        </div>
      </main>
    </div>
  );
}

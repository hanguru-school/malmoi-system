"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../../login/login.module.css";

export default function PasswordResetVerifyContent() {
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token") || "");
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function verify() {
      if (!token) {
        if (!active) return;
        setStatus({ type: "error", text: "再設定リンクが無効です。" });
        setChecking(false);
        return;
      }
      try {
        const response = await fetch(`/api/auth/password-reset/verify?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || "リンクが無効です。");
        if (!active) return;
        setValid(true);
      } catch (error) {
        if (!active) return;
        setStatus({ type: "error", text: error.message || "再設定リンクが無効です。" });
      } finally {
        if (active) setChecking(false);
      }
    }
    verify();
    return () => {
      active = false;
    };
  }, [token]);

  async function resetPassword() {
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "初期化に失敗しました。");
      const hint = data?.initialPasswordHint ? `初期パスワード方式: ${data.initialPasswordHint}` : "";
      const tempPassword = data?.temporaryPassword
        ? ` / 一時パスワード: ${data.temporaryPassword}`
        : "";
      setValid(false);
      setStatus({
        type: "ok",
        text: `初期化が完了しました。ログイン後に新しいパスワードへ変更してください。${hint}${tempPassword}`,
      });
    } catch (error) {
      setStatus({ type: "error", text: error.message || "初期化に失敗しました。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>パスワード再設定</h1>
        {checking ? <p className={styles.description}>本人確認中...</p> : null}
        {!checking && valid ? (
          <>
            <p className={styles.description}>本人確認が完了しました</p>
            <p className={styles.description}>パスワードを初期化しますか？</p>
            <button className={styles.button} type="button" onClick={resetPassword} disabled={isSubmitting}>
              {isSubmitting ? "初期化中..." : "パスワードを初期化する"}
            </button>
          </>
        ) : null}

        {status.text ? (
          <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
            {status.text}
          </p>
        ) : null}

        <div className={styles.links}>
          <a className={styles.link} href="/login">
            ログインへ戻る
          </a>
        </div>
      </main>
    </div>
  );
}

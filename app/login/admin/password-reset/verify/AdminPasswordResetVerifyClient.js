"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../../../login.module.css";

export default function AdminPasswordResetVerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();

  const [phase, setPhase] = useState("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) {
        setPhase("invalid");
        setStatus({ type: "error", text: "リンクが不正です。最初からやり直してください。" });
        return;
      }
      try {
        const res = await fetch("/api/auth/admin-password-reset/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          setPhase("invalid");
          setStatus({
            type: "error",
            text: data?.error || "リンクの有効期限が切れたか、すでに使用されています。再度メールを請求してください。",
          });
          return;
        }
        setPhase("form");
      } catch {
        if (!cancelled) {
          setPhase("invalid");
          setStatus({ type: "error", text: "トークンの確認に失敗しました。しばらくしてから再度お試しください。" });
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/admin-password-reset/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "パスワードの更新に失敗しました。");
      }
      setStatus({ type: "ok", text: "パスワードを更新しました。ログイン画面へ移動します。" });
      setTimeout(() => router.push("/login/admin"), 1600);
    } catch (e) {
      setStatus({ type: "error", text: e.message || "再設定に失敗しました。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>新しいパスワードの設定</h1>
        {phase === "checking" ? <p className={styles.description}>リンクを確認しています…</p> : null}

        {phase === "form" ? (
          <>
            <p className={styles.description}>新しいパスワードを入力し、確認のためもう一度入力してください。</p>
            <form onSubmit={submit}>
              <label className={styles.label}>
                新しいパスワード
                <input
                  className={styles.field}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </label>
              <label className={styles.label}>
                新しいパスワード（確認）
                <input
                  className={styles.field}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </label>
              <button className={styles.button} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "パスワードを保存"}
              </button>
            </form>
          </>
        ) : null}

        {phase === "invalid" ? (
          <p className={styles.description}>
            <a className={styles.link} href="/login/admin/password-reset">
              再設定メールを再度請求する
            </a>
          </p>
        ) : null}

        {status.text ? (
          <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
            {status.text}
          </p>
        ) : null}

        <div className={styles.links}>
          <a className={styles.link} href="/login/admin">
            管理者ログインへ
          </a>
        </div>
      </main>
    </div>
  );
}

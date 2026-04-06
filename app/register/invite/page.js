"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../../login/login.module.css";

function InviteForm() {
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameFurigana, setNameFurigana] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setErr("招待トークンがありません。");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/invite-preview?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error || "無効な招待です。");
        if (!cancelled) {
          setPreview(data.preview);
          setDisplayName(data.preview.displayNameSuggestion || "");
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/complete-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, displayName, phone, nameFurigana }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "登録に失敗しました。");
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className={styles.card}>
        <h1 className={styles.sectionTitle}>登録が完了しました</h1>
        <p className={styles.description}>
          <Link href="/login">ログイン画面</Link> からメールとパスワードでサインインしてください。
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.sectionTitle}>招待登録</h1>
      {preview ? (
        <p className={styles.description}>
          役割: <strong>{preview.role === "parent" ? "保護者" : "講師"}</strong> / メール: {preview.email}
          {preview.studentNameKanji ? ` / 対象学生: ${preview.studentNameKanji}` : ""}
        </p>
      ) : null}
      {err ? <p className={`${styles.message} ${styles.messageError}`}>{err}</p> : null}
      {preview ? (
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            表示名
            <input className={styles.field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </label>
          <label className={styles.label}>
            フリガナ（任意）
            <input className={styles.field} value={nameFurigana} onChange={(e) => setNameFurigana(e.target.value)} />
          </label>
          <label className={styles.label}>
            電話（任意）
            <input className={styles.field} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className={styles.label}>
            パスワード（8文字以上）
            <input
              className={styles.field}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <button className={styles.button} type="submit" disabled={busy}>
            {busy ? "登録中..." : "登録を完了"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export default function RegisterInvitePage() {
  return (
    <Suspense fallback={<div className={styles.card}>読み込み中...</div>}>
      <InviteForm />
    </Suspense>
  );
}

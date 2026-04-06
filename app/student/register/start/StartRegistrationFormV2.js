"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../../login/login.module.css";
import rv2 from "../register-v2.module.css";
import { postStartRegistration } from "../../../../lib/adapters/studentRegistration";

const RESEND_COOLDOWN_SECONDS = 30;

function maskEmail(rawEmail) {
  const value = String(rawEmail || "").trim();
  const [local, domain] = value.split("@");
  if (!local || !domain) return value;
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export default function StartRegistrationFormV2({ initialErrorText = "" }) {
  const [nameKanji, setNameKanji] = useState("");
  const [nameFurigana, setNameFurigana] = useState("");
  const [email, setEmail] = useState("");
  const [submittedPayload, setSubmittedPayload] = useState(null);
  const [mode, setMode] = useState("form");
  const [errorText, setErrorText] = useState(String(initialErrorText || "").trim());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const maskedSubmittedEmail = useMemo(() => maskEmail(submittedPayload?.email || ""), [submittedPayload?.email]);

  useEffect(() => {
    if (cooldownLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldownLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { nameKanji, nameFurigana, email };
    setIsSubmitting(true);
    setErrorText("");
    try {
      await postStartRegistration(payload);
      setSubmittedPayload(payload);
      setMode("sent");
      setCooldownLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorText(
        error?.message ||
          "確認メール送信中にエラーが発生しました。\n通信状況をご確認のうえ、もう一度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!submittedPayload || isSubmitting || cooldownLeft > 0) return;
    setIsSubmitting(true);
    setErrorText("");
    try {
      await postStartRegistration(submittedPayload);
      setCooldownLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorText(
        error?.message ||
          "確認メール送信中にエラーが発生しました。\n通信状況をご確認のうえ、もう一度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "sent") {
    return (
      <section aria-live="polite">
        {errorText ? (
          <div className={`${styles.message} ${styles.messageError}`}>
            <p style={{ whiteSpace: "pre-line" }}>{errorText}</p>
          </div>
        ) : null}
        <div className={rv2.sentHero}>
          <div className={rv2.sentIcon} aria-hidden>
            ✉
          </div>
          <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
            確認メールを送信しました
          </h2>
          <p className={styles.description}>
            メール内のリンクを開き、同意とプロフィール入力へ進んでください。
          </p>
          <p className={styles.description}>
            <strong>{maskedSubmittedEmail}</strong> 宛に送信済みです。
          </p>
        </div>
        <p className={styles.stepNote}>
          迷惑メールフォルダもご確認ください。届かない場合は再送できます。
        </p>
        <div className={styles.registerSentActions}>
          <a
            className={`${styles.button} ${styles.registerSecondaryButton}`}
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
          >
            メールを開く
          </a>
          <button
            className={styles.button}
            type="button"
            onClick={handleResend}
            disabled={isSubmitting || cooldownLeft > 0}
          >
            {isSubmitting ? "送信中..." : "再送信"}
          </button>
        </div>
        {cooldownLeft > 0 ? <p className={styles.stepNote}>再送まであと {cooldownLeft} 秒</p> : null}
        <div className={rv2.footerLinks}>
          <Link href="/student/register/start?ui=v1">以前の画面表示に切替</Link>
          <span> · </span>
          <Link href="/login">ログインへ</Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorText ? (
        <div className={`${styles.message} ${styles.messageError}`}>
          <p style={{ whiteSpace: "pre-line" }}>{errorText}</p>
        </div>
      ) : null}
      <label className={styles.label}>
        お名前（漢字）
        <input
          className={styles.field}
          value={nameKanji}
          onChange={(e) => setNameKanji(e.target.value)}
          placeholder="例）山田 花子"
          autoComplete="name"
          required
        />
      </label>
      <label className={styles.label}>
        フリガナ
        <input
          className={styles.field}
          value={nameFurigana}
          onChange={(e) => setNameFurigana(e.target.value)}
          placeholder="例）ヤマダ ハナコ"
          required
        />
      </label>
      <label className={styles.label}>
        メールアドレス
        <input
          className={styles.field}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>
      <button className={styles.button} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "確認メールを送信"}
      </button>
      <div className={rv2.footerLinks}>
        <Link href="/student/register/start?ui=v1">以前の画面</Link>
        <span> · </span>
        <Link href="/login">ログインへ</Link>
      </div>
    </form>
  );
}

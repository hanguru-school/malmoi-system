"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../../login/login.module.css";

const RESEND_COOLDOWN_SECONDS = 30;

function maskEmail(rawEmail) {
  const value = String(rawEmail || "").trim();
  const [local, domain] = value.split("@");
  if (!local || !domain) return value;
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export default function StartRegistrationForm({ initialErrorText = "" }) {
  const [nameKanji, setNameKanji] = useState("");
  const [nameFurigana, setNameFurigana] = useState("");
  const [email, setEmail] = useState("");
  const [submittedPayload, setSubmittedPayload] = useState(null);
  const [mode, setMode] = useState("form");
  const [errorText, setErrorText] = useState(String(initialErrorText || "").trim());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const maskedSubmittedEmail = useMemo(
    () => maskEmail(submittedPayload?.email || ""),
    [submittedPayload?.email],
  );

  useEffect(() => {
    if (cooldownLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldownLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  async function requestRegistrationMail(payload) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[register/start] request started", { email: payload.email });
    }
    const response = await fetch("/api/auth/start-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[register/start] request failed", {
          status: response.status,
          error: data?.error,
        });
      }
      throw new Error(
        "確認メールの送信に失敗しました。\n通信状況をご確認のうえ、もう一度お試しください。",
      );
    }
    if (process.env.NODE_ENV !== "production") {
      console.info("[register/start] request succeeded", {
        status: response.status,
        email: payload.email,
      });
    }
    return data;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { nameKanji, nameFurigana, email };
    setIsSubmitting(true);
    setErrorText("");

    try {
      await requestRegistrationMail(payload);
      setSubmittedPayload(payload);
      setMode("sent");
      setCooldownLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorText(error.message || "確認メール送信中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!submittedPayload || isSubmitting || cooldownLeft > 0) return;
    setIsSubmitting(true);
    setErrorText("");
    try {
      await requestRegistrationMail(submittedPayload);
      setCooldownLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorText(error.message || "確認メール送信中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "sent") {
    return (
      <section className={styles.registerSentCard} aria-live="polite">
        {errorText ? (
          <div className={`${styles.message} ${styles.messageError}`}>
            <p style={{ whiteSpace: "pre-line" }}>{errorText}</p>
          </div>
        ) : null}
        <div className={styles.registerSentIcon} aria-hidden>
          ✉
        </div>
        <h2 className={styles.registerSentTitle}>確認メールを送信しました</h2>
        <p className={styles.description}>
          ご入力いただいたメールアドレス宛に、登録用の確認メールをお送りしました。
          <br />
          メール内のリンクを開いて、登録を続けてください。
        </p>
        <p className={styles.registerSentEmail}>{maskedSubmittedEmail} に確認メールを送信しました。</p>
        <p className={styles.stepNote}>
          メールが見当たらない場合は、迷惑メールフォルダもご確認ください。
          <br />
          数分待っても届かない場合は、もう一度送信してください。
        </p>
        <div className={styles.registerSentActions}>
          <a
            className={`${styles.button} ${styles.registerSecondaryButton}`}
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
          >
            メールアプリを開く
          </a>
          <button
            className={styles.button}
            type="button"
            onClick={handleResend}
            disabled={isSubmitting || cooldownLeft > 0}
          >
            {isSubmitting ? "送信中..." : "もう一度送信する"}
          </button>
        </div>
        {cooldownLeft > 0 ? <p className={styles.stepNote}>再送まであと {cooldownLeft} 秒</p> : null}
        <div className={styles.links}>
          <a className={styles.link} href="/login">
            ログイン画面へ戻る
          </a>
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
        お名前 (漢字)
        <input
          className={styles.field}
          value={nameKanji}
          onChange={(event) => setNameKanji(event.target.value)}
          placeholder="例) 山田 花子"
          required
        />
      </label>
      <label className={styles.label}>
        フリガナ
        <input
          className={styles.field}
          value={nameFurigana}
          onChange={(event) => setNameFurigana(event.target.value)}
          placeholder="例) ヤマダ ハナコ"
          required
        />
      </label>
      <label className={styles.label}>
        メールアドレス
        <input
          className={styles.field}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>

      <button className={styles.button} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "確認メールを送信"}
      </button>
      <div className={styles.links}>
        <a className={styles.link} href="/login">
          ログイン画面へ戻る
        </a>
      </div>
    </form>
  );
}

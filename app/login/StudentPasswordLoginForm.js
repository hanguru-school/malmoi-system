"use client";

import { useState } from "react";
import styles from "./login.module.css";

export default function StudentPasswordLoginForm({
  introUrl,
  title = "学生ログイン",
  role = "student",
  loginIdPlaceholder = "メール / 電話番号 / 学生番号",
  showStudentUtilityLinks = true,
  showStaffLinks = true,
  fallbackNextPath = "/login/next",
  extraLinks = [],
  roleLinks = null,
}) {
  const resolvedRoleLinks = roleLinks || [
    { href: "/login/parent", label: "保護者ログイン" },
    { href: "/login/teacher", label: "先生ログイン" },
    { href: "/login/admin", label: "管理者ログイン" },
  ];

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId,
          password,
          role,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "ログインに失敗しました。");
      }
      window.location.href = data.nextPath || fallbackNextPath;
    } catch (error) {
      setStatus({ type: "error", text: error.message || "ログイン中にエラーが発生しました。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <section className={styles.studentLoginCard}>
        <h2 className={styles.studentLoginTitle}>{title}</h2>
        <label className={styles.label}>
          ログインID
          <input
            className={styles.field}
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder={loginIdPlaceholder}
            required
          />
        </label>
        <label className={styles.label}>
          パスワード
          <input
            className={styles.field}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="パスワード"
            required
          />
        </label>

        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "ログイン中..." : "ログイン"}
        </button>

        {showStudentUtilityLinks ? (
          <div className={styles.loginUtilityRow}>
            <a className={`${styles.utilityLinkButton} ${styles.utilityLinkButtonStudent}`} href="/student/register/start">
              新規学生登録
            </a>
            <a className={`${styles.utilityLinkButton} ${styles.utilityLinkButtonAlt}`} href="/login/parent">
              保護者ログイン
            </a>
            <a className={styles.utilityLinkButton} href="/password-reset/request">パスワードをお忘れの方</a>
          </div>
        ) : null}

        {status.text ? (
          <div className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
            <p>{status.text}</p>
          </div>
        ) : null}
      </section>

      {showStaffLinks ? (
        <section className={styles.staffLinkRow}>
          <span className={styles.staffLabel}>他の役割ログイン:</span>
          {resolvedRoleLinks.map((link) => (
            <a key={`${link.href}:${link.label}`} className={styles.staffLink} href={link.href}>
              {link.label}
            </a>
          ))}
        </section>
      ) : null}

      <div className={styles.footerLinks}>
        {extraLinks.map((link) => (
          <a key={`${link.href}:${link.label}`} className={styles.link} href={link.href}>
            {link.label}
          </a>
        ))}
        <a className={styles.link} href={introUrl}>イントロページへ戻る</a>
      </div>
    </form>
  );
}

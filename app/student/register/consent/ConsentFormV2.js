"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../../login/login.module.css";
import rv2 from "../register-v2.module.css";
import { postStudentConsentAgree } from "../../../../lib/adapters/studentRegistration";
import { registrationProfilePath } from "../../../../lib/student/registrationNavPaths";

export default function ConsentFormV2({ registrationUi }) {
  const router = useRouter();
  const [checkedPolicy, setCheckedPolicy] = useState(false);
  const [checkedEnrollment, setCheckedEnrollment] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!checkedPolicy || !checkedEnrollment) {
      setStatus({ type: "error", text: "両方の項目にチェックを入れてください。" });
      return;
    }
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      await postStudentConsentAgree();
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
      <div className={rv2.consentCard}>
        <label>
          <input type="checkbox" checked={checkedPolicy} onChange={(e) => setCheckedPolicy(e.target.checked)} />
          <span>教室規定（授業・予約のルール）に同意します。</span>
        </label>
      </div>
      <div className={rv2.consentCard}>
        <label>
          <input
            type="checkbox"
            checked={checkedEnrollment}
            onChange={(e) => setCheckedEnrollment(e.target.checked)}
          />
          <span>入会内容および個人情報の取り扱いに同意します。</span>
        </label>
      </div>
      <p className={styles.stepNote} style={{ marginTop: "0.75rem" }}>
        同意後、プロフィール入力（連絡先・緊急連絡先など）に進みます。
      </p>
      <button className={styles.button} type="submit" disabled={isSubmitting} style={{ marginTop: "1rem", width: "100%" }}>
        {isSubmitting ? "処理中..." : "同意して次へ"}
      </button>
      {status.text ? (
        <p className={`${styles.message} ${styles.messageError}`} style={{ marginTop: "0.75rem" }}>
          {status.text}
        </p>
      ) : null}
      <div className={rv2.footerLinks}>
        <Link href="/student/register/consent?ui=v1">以前の画面</Link>
      </div>
    </form>
  );
}

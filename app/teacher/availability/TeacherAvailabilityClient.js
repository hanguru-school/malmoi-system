"use client";

import { useEffect, useState } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../../admin/admin.module.css";

export default function TeacherAvailabilityClient({ initial }) {
  const [weeklyJson, setWeeklyJson] = useState("{}");
  const [exceptionsJson, setExceptionsJson] = useState("[]");
  const [policyNote, setPolicyNote] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setWeeklyJson(JSON.stringify(initial.weekly || {}, null, 2));
    setExceptionsJson(JSON.stringify(initial.exceptions || [], null, 2));
    const pol = initial.policy || {};
    setPolicyNote(
      `編集目安: ${pol.editableDaysBefore ?? "?"} 日前まで / ロック ${pol.lockHoursBeforeLesson ?? "?"} 時間前 / 管理者のみ: ${
        pol.adminOnlyEdit ? "ON" : "OFF"
      }`
    );
  }, [initial]);

  async function save() {
    let weekly;
    let exceptions;
    try {
      weekly = JSON.parse(weeklyJson || "{}");
      exceptions = JSON.parse(exceptionsJson || "[]");
    } catch {
      setStatus({ type: "error", text: "JSON を確認してください。" });
      return;
    }
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch("/api/teacher/my-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekly, exceptions }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "保存に失敗しました。");
      setStatus({ type: "success", text: "保存しました。" });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (!initial) {
    return <p className={styles.description}>データを読み込めませんでした。</p>;
  }

  return (
    <section className={adminStyles.sectionBlock}>
      <p className={adminStyles.smallMuted}>{policyNote}</p>
      {initial.adminLocks?.length ? (
        <p className={adminStyles.smallMuted}>管理者ロック: {JSON.stringify(initial.adminLocks)}</p>
      ) : null}
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>{status.text}</p>
      ) : null}
      <label className={styles.label}>
        weekly (JSON)
        <textarea className={styles.field} rows={8} value={weeklyJson} onChange={(e) => setWeeklyJson(e.target.value)} />
      </label>
      <label className={styles.label}>
        例外 (JSON 配列)
        <textarea className={styles.field} rows={5} value={exceptionsJson} onChange={(e) => setExceptionsJson(e.target.value)} />
      </label>
      <button className={styles.button} type="button" disabled={saving} onClick={save}>
        {saving ? "保存中..." : "保存"}
      </button>
    </section>
  );
}

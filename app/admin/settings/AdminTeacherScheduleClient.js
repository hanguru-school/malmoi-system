"use client";

import { useEffect, useState } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";

export default function AdminTeacherScheduleClient() {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [weeklyJson, setWeeklyJson] = useState("{}");
  const [exceptionsJson, setExceptionsJson] = useState("[]");
  const [locksJson, setLocksJson] = useState("[]");
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/teacher-availability", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "取得に失敗しました。");
      setProfiles(data.profiles || []);
      if (data.profiles?.length && !selectedId) {
        setSelectedId(data.profiles[0].teacherUserId);
      }
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = profiles.find((p) => p.teacherUserId === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    setWeeklyJson(JSON.stringify(selected.weekly || {}, null, 2));
    setExceptionsJson(JSON.stringify(selected.exceptions || [], null, 2));
    setLocksJson(JSON.stringify(selected.adminLocks || [], null, 2));
  }, [selected]);

  async function save() {
    if (!selectedId) return;
    let weekly;
    let exceptions;
    let adminLocks;
    try {
      weekly = JSON.parse(weeklyJson || "{}");
      exceptions = JSON.parse(exceptionsJson || "[]");
      adminLocks = JSON.parse(locksJson || "[]");
    } catch {
      setStatus({ type: "error", text: "JSON の形式を確認してください。" });
      return;
    }
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/teacher-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherUserId: selectedId, weekly, exceptions, adminLocks }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "保存に失敗しました。");
      setStatus({ type: "success", text: "講師の可否時間を保存しました。" });
      await load();
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={adminStyles.sectionBlock} style={{ marginTop: "1rem" }}>
      <h3 className={adminStyles.groupTitle}>講師別・週次可否と例外</h3>
      <p className={adminStyles.smallMuted}>
        weekly は曜日キー 0=日〜6=土 の JSON オブジェクト。各曜日は intervals 配列（start/end）を推奨します。
      </p>
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>{status.text}</p>
      ) : null}
      {loading ? <p className={adminStyles.smallMuted}>読み込み中...</p> : null}
      <div className={adminStyles.compactFormGrid}>
        <label className={styles.label}>
          講師
          <select className={styles.field} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.teacherUserId} value={p.teacherUserId}>
                {p.displayName} ({p.email})
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.label}>
        weekly (JSON)
        <textarea className={styles.field} rows={6} value={weeklyJson} onChange={(e) => setWeeklyJson(e.target.value)} />
      </label>
      <label className={styles.label}>
        日付例外 (JSON 配列)
        <textarea className={styles.field} rows={4} value={exceptionsJson} onChange={(e) => setExceptionsJson(e.target.value)} />
      </label>
      <label className={styles.label}>
        管理者ロック (JSON 配列)
        <textarea className={styles.field} rows={3} value={locksJson} onChange={(e) => setLocksJson(e.target.value)} />
      </label>
      <div className={adminStyles.compactActions}>
        <button className={styles.button} type="button" disabled={saving || !selectedId} onClick={save}>
          {saving ? "保存中..." : "この講師の設定を保存"}
        </button>
      </div>
    </section>
  );
}

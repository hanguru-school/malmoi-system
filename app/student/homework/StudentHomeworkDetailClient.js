"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";

function statusLabel(status) {
  if (status === "not_started") return "未完了";
  if (status === "in_progress") return "未完了";
  if (status === "submitted") return "提出済み";
  if (status === "reviewed") return "完了";
  if (status === "completed") return "完了";
  return "-";
}

export default function StudentHomeworkDetailClient({ item }) {
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const done = status === "reviewed" || status === "completed";
  const submitted = status === "submitted";

  async function patch(patch) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/student/homework/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "更新に失敗しました。");
      setStatus(data?.item?.status || patch.status || status);
    } catch (e) {
      setError(e.message || "エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.links} style={{ marginTop: "0.75rem" }}>
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      {item.relatedLessonNoteId ? (
        <p style={{ marginBottom: "0.65rem" }}>
          <Link className={styles.link} href={`/student/lesson-notes#note-${item.relatedLessonNoteId}`}>
            対応するレッスンノートを開く
          </Link>
        </p>
      ) : null}

      <section>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: done ? "default" : "pointer" }}>
          <input
            type="checkbox"
            checked={submitted || done}
            disabled={saving || done}
            onChange={() => {
              if (!done && !submitted) patch({ status: "submitted" });
            }}
          />
          <span style={{ fontWeight: 700 }}>やり終えたらチェック（提出）</span>
        </label>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.35rem" }}>状態: {statusLabel(status)}</p>
      </section>
    </div>
  );
}

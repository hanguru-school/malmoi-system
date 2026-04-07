"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../login/login.module.css";

/**
 * 提出済み宿題を一括で確認済みへ（既存 bulk-status API）
 * @param {{ items: Array<{ id: string, label?: string }> }} props
 */
export default function SubmittedHomeworkBulkBar({ items = [] }) {
  const rows = useMemo(
    () =>
      (items || [])
        .map((r) => ({ id: String(r.id || "").trim(), label: String(r.label || r.id || "").trim() }))
        .filter((r) => r.id),
    [items]
  );
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  const [selected, setSelected] = useState(() => new Set(ids));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelected(new Set(ids));
  }, [ids]);

  if (rows.length === 0) return null;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(status) {
    const list = [...selected];
    if (list.length === 0) {
      setMessage("対象を選択してください。");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/homework/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeworkIds: list, status }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "一括更新に失敗しました。");
      setMessage(`${data.result?.updatedCount ?? list.length}件を更新しました。`);
      window.location.reload();
    } catch (e) {
      setMessage(e.message || "エラー");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "0.65rem",
        padding: "0.55rem 0.65rem",
        borderRadius: "10px",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        background: "rgba(239, 246, 255, 0.95)",
      }}
    >
      <p className={styles.description} style={{ margin: "0 0 0.35rem" }}>
        提出確認待ちを一括で「確認済み」にできます（対象を選択）
      </p>
      <div className={styles.links} style={{ flexWrap: "wrap", marginBottom: "0.35rem" }}>
        <button className={styles.button} type="button" onClick={() => setSelected(new Set(ids))}>
          すべて選択
        </button>
        <button className={styles.button} type="button" onClick={() => setSelected(new Set())}>
          解除
        </button>
        <button
          className={styles.button}
          type="button"
          disabled={saving || selected.size === 0}
          onClick={() => runBulk("reviewed")}
        >
          {saving ? "処理中..." : "確認済みに一括更新"}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "220px", overflow: "auto" }}>
        {rows.map((r) => (
          <label
            key={r.id}
            style={{
              cursor: "pointer",
              display: "flex",
              gap: "0.45rem",
              alignItems: "flex-start",
              fontSize: "0.84rem",
              color: "#334155",
            }}
          >
            <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
            <span>{r.label}</span>
          </label>
        ))}
      </div>
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}

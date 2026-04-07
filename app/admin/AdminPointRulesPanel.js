"use client";

import { useEffect, useState } from "react";
import styles from "../login/login.module.css";
import adminStyles from "./admin.module.css";

function newYenPointRule() {
  return {
    id: `draft-yen-${Math.random().toString(36).slice(2, 10)}`,
    yenAmount: 1,
    points: 1,
    isActive: true,
  };
}

function newPointMinuteRule() {
  return {
    id: `draft-time-${Math.random().toString(36).slice(2, 10)}`,
    pointAmount: 1,
    minutes: 1,
    isActive: true,
  };
}

export default function AdminPointRulesPanel() {
  const [rules, setRules] = useState([]);
  const [pointTimeRules, setPointTimeRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/point-rules", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "換算ルールを読み込めませんでした。");
        }
        if (!cancelled) {
          setRules(Array.isArray(data.rules) ? data.rules : []);
          setPointTimeRules(Array.isArray(data.pointTimeRules) ? data.pointTimeRules : []);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ type: "error", text: error.message || "読み込み失敗" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRule(id, patch) {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  function removeRule(id) {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  }

  function updatePointTimeRule(id, patch) {
    setPointTimeRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  function removePointTimeRule(id) {
    setPointTimeRules((prev) => prev.filter((rule) => rule.id !== id));
  }

  async function saveRules() {
    setSaving(true);
    setStatus({ type: "", text: "" });

    try {
      const payload = rules.map((rule) => ({
        id: String(rule.id || ""),
        yenAmount: Math.max(1, Number(rule.yenAmount || 1)),
        points: Math.max(1, Number(rule.points || 1)),
        isActive: Boolean(rule.isActive),
      }));
      const pointTimePayload = pointTimeRules.map((rule) => ({
        id: String(rule.id || ""),
        pointAmount: Math.max(1, Number(rule.pointAmount || 1)),
        minutes: Math.max(1, Number(rule.minutes || 1)),
        isActive: Boolean(rule.isActive),
      }));

      const response = await fetch("/api/admin/point-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: payload, pointTimeRules: pointTimePayload }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "換算ルールの保存に失敗しました。");
      }
      setRules(Array.isArray(data.rules) ? data.rules : payload);
      setPointTimeRules(Array.isArray(data.pointTimeRules) ? data.pointTimeRules : pointTimePayload);
      setStatus({ type: "ok", text: "ポイント換算ルールを保存しました。" });
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存失敗" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2 className={styles.sectionTitle}>ポイント設定</h2>
      <p className={styles.description}>円→ポイント、ポイント→時間(分)の両方を管理できます。</p>

      {loading ? <p className={styles.description}>読み込み中...</p> : null}

      <h3 className={styles.sectionTitle}>円額→ポイント ルール</h3>
      {rules.map((rule) => (
        <div key={rule.id} className={adminStyles.compactFormGrid} style={{ marginBottom: 8 }}>
          <input
            className={styles.field}
            type="number"
            min="1"
            value={rule.yenAmount}
            onChange={(e) => updateRule(rule.id, { yenAmount: Number(e.target.value || 1) })}
            placeholder="円"
          />
          <input
            className={styles.field}
            type="number"
            min="1"
            value={rule.points}
            onChange={(e) => updateRule(rule.id, { points: Number(e.target.value || 1) })}
            placeholder="ポイント"
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={Boolean(rule.isActive)}
              onChange={(e) => updateRule(rule.id, { isActive: e.target.checked })}
            />
            有効
          </label>
          <button className={styles.secondaryButton} type="button" onClick={() => removeRule(rule.id)}>
            削除
          </button>
        </div>
      ))}
      <div style={{ marginBottom: 12 }}>
        <button className={styles.secondaryButton} type="button" onClick={() => setRules((prev) => [...prev, newYenPointRule()])}>
          円額→ポイント ルール追加
        </button>
      </div>

      <h3 className={styles.sectionTitle}>ポイント→時間(分) ルール</h3>
      {pointTimeRules.map((rule) => (
        <div key={rule.id} className={adminStyles.compactFormGrid} style={{ marginBottom: 8 }}>
          <input
            className={styles.field}
            type="number"
            min="1"
            value={rule.pointAmount}
            onChange={(e) => updatePointTimeRule(rule.id, { pointAmount: Number(e.target.value || 1) })}
            placeholder="基準ポイント"
          />
          <input
            className={styles.field}
            type="number"
            min="1"
            value={rule.minutes}
            onChange={(e) => updatePointTimeRule(rule.id, { minutes: Number(e.target.value || 1) })}
            placeholder="換算時間(分)"
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={Boolean(rule.isActive)}
              onChange={(e) => updatePointTimeRule(rule.id, { isActive: e.target.checked })}
            />
            有効
          </label>
          <button className={styles.secondaryButton} type="button" onClick={() => removePointTimeRule(rule.id)}>
            削除
          </button>
        </div>
      ))}
      <div className={adminStyles.compactActions}>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => setPointTimeRules((prev) => [...prev, newPointMinuteRule()])}
        >
          ポイント→時間 ルール追加
        </button>
        <button className={styles.button} type="button" disabled={saving || loading} onClick={saveRules}>
          {saving ? "保存中..." : "換算ルール保存"}
        </button>
      </div>

      {status.text ? (
        <p className={`${styles.message} ${status.type === "error" ? styles.messageError : styles.messageSuccess}`}>{status.text}</p>
      ) : null}
    </section>
  );
}

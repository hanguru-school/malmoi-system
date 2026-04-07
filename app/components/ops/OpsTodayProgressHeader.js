"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * 本日の未処理: 全体/完了/残り/完了率（クライアントでピーク残件を保持）
 */
export default function OpsTodayProgressHeader({
  dateYmd = "",
  role = "teacher",
  remaining = 0,
  className = "",
}) {
  const [peakRemaining, setPeakRemaining] = useState(remaining);

  useEffect(() => {
    setPeakRemaining((prev) => Math.max(prev, remaining));
  }, [remaining]);

  const completed = useMemo(() => Math.max(0, peakRemaining - remaining), [peakRemaining, remaining]);
  const pct =
    peakRemaining > 0 ? Math.min(100, Math.round((completed / peakRemaining) * 100)) : remaining === 0 ? 100 : 0;
  const allDone = remaining === 0 && peakRemaining > 0;
  const emptyDay = remaining === 0 && peakRemaining === 0;

  return (
    <div
      className={className}
      style={{
        marginBottom: "0.85rem",
        padding: "0.65rem 0.75rem",
        borderRadius: "12px",
        border: allDone ? "1px solid rgba(34, 197, 94, 0.45)" : "1px solid rgba(59, 130, 246, 0.35)",
        background: allDone ? "rgba(220, 252, 231, 0.85)" : "rgba(239, 246, 255, 0.95)",
      }}
      aria-label="本日の進捗"
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "#64748b",
          }}
        >
          本日の処理（{dateYmd}）
        </p>
        {allDone ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.12rem 0.45rem",
              borderRadius: "999px",
              fontSize: "0.68rem",
              fontWeight: 800,
              background: "#22c55e",
              color: "#fff",
            }}
          >
            本日完了
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "baseline" }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
          全体 <strong style={{ color: "#1d4ed8" }}>{peakRemaining}</strong>
        </span>
        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
          完了 <strong style={{ color: "#15803d" }}>{completed}</strong>
        </span>
        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
          残り <strong style={{ color: remaining > 0 ? "#c2410c" : "#15803d" }}>{remaining}</strong>
        </span>
        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
          完了率 <strong style={{ color: "#4338ca" }}>{emptyDay ? "—" : `${pct}%`}</strong>
        </span>
      </div>
      <div
        style={{
          marginTop: "0.45rem",
          height: "8px",
          borderRadius: "999px",
          background: "rgba(148, 163, 184, 0.35)",
          overflow: "hidden",
        }}
        aria-hidden
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: allDone ? "#22c55e" : "linear-gradient(90deg, #3b82f6, #6366f1)",
            transition: "width 0.35s ease",
          }}
        />
      </div>
      {allDone ? (
        <p style={{ margin: "0.45rem 0 0", fontSize: "0.88rem", fontWeight: 800, color: "#166534" }}>
          本日のタスクはすべて完了しました。
        </p>
      ) : emptyDay ? (
        <p style={{ margin: "0.45rem 0 0", fontSize: "0.86rem", color: "#64748b" }}>本日の未処理タスクはありません。</p>
      ) : null}
    </div>
  );
}

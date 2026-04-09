"use client";

import { useEffect, useState } from "react";
import s from "./ClassroomWeekHoursPortalStrip.module.css";

/**
 * 学生・講師ポータル：教室の週次営業（管理画面の曜日順と同じ視覚言語のピル列）
 */
export default function ClassroomWeekHoursPortalStrip() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portal/classroom-week-hours", { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error || "取得できませんでした");
        if (!cancelled) setRows(data.rows || []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return null;
  if (!rows?.length) return null;

  return (
    <section className={s.wrap} aria-label="教室の週次営業時間">
      <h2 className={s.title}>教室の週次営業</h2>
      <div className={s.grid}>
        {rows.map((r) => (
          <span key={r.wd} className={`${s.pill} ${r.closed ? s.pillClosed : ""}`}>
            <span className={s.label}>{r.label}</span>
            <span>{r.text}</span>
          </span>
        ))}
      </div>
      <p className={s.muted}>日別の休業・短縮は予約枠計算に反映されます（詳細は教室にお問い合わせください）。</p>
    </section>
  );
}

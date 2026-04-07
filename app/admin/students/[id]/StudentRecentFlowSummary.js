"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import detailStyles from "./student-detail.module.css";
import adminStyles from "../../admin.module.css";

const KEYWORDS = ["発音", "助詞", "語尾", "文法", "会話", "復習", "宿題"];

function extractRepeatedHints(notes) {
  const texts = [];
  (notes || []).forEach((n) => {
    texts.push(String(n.summary || ""), String(n.content || ""), String(n.title || ""));
  });
  const counts = {};
  KEYWORDS.forEach((k) => {
    counts[k] = 0;
  });
  texts.forEach((text) => {
    KEYWORDS.forEach((k) => {
      if (text.includes(k)) counts[k] += 1;
    });
  });
  return Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .map(([k]) => k);
}

function statusJa(status) {
  const map = {
    not_started: "未着手",
    in_progress: "取組中",
    submitted: "提出済み",
    reviewed: "確認済み",
    completed: "完了",
  };
  return map[status] || status || "—";
}

function truncate(s, max) {
  const t = String(s || "").trim();
  if (!t) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/**
 * @param {{ studentId: string, apiRole: "admin" | "teacher" }} props
 */
export default function StudentRecentFlowSummary({ studentId, apiRole = "admin" }) {
  const [notes, setNotes] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!studentId) return;
      setLoading(true);
      setErr("");
      try {
        const notesUrl =
          apiRole === "teacher"
            ? `/api/teacher/lesson-notes?studentId=${encodeURIComponent(studentId)}`
            : `/api/admin/lesson-notes?studentId=${encodeURIComponent(studentId)}`;
        const hwUrl = `/api/admin/homework?studentId=${encodeURIComponent(studentId)}`;
        const [nRes, hRes] = await Promise.all([fetch(notesUrl, { cache: "no-store" }), fetch(hwUrl, { cache: "no-store" })]);
        const nData = await nRes.json();
        const hData = await hRes.json();
        if (!nRes.ok || !nData?.ok) throw new Error(nData?.error || "ノート取得に失敗しました。");
        if (!hRes.ok || !hData?.ok) throw new Error(hData?.error || "宿題取得に失敗しました。");
        if (!cancelled) {
          setNotes(nData.notes || []);
          setHomework(hData.items || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "読み込みエラー");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [studentId, apiRole]);

  const last3 = useMemo(() => notes.slice(0, 3), [notes]);
  const repeatedHints = useMemo(() => extractRepeatedHints(notes.slice(0, 12)), [notes]);
  const latestNext = notes[0]?.nextLessonPlan ? String(notes[0].nextLessonPlan).trim() : "";
  const recentHw = useMemo(() => homework.slice(0, 5), [homework]);

  const todayJst = useMemo(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date()),
    []
  );

  const actionLinks =
    apiRole === "teacher"
      ? [
          { href: `/teacher/today`, label: "次回レッスンを確認" },
          { href: `/teacher/lesson-notes?studentId=${encodeURIComponent(studentId)}`, label: "レッスンノートを見る" },
          { href: `/teacher/homework?studentId=${encodeURIComponent(studentId)}`, label: "宿題を確認" },
          { href: `/teacher/schedule?date=${encodeURIComponent(todayJst)}`, label: "予約状況を見る" },
        ]
      : [
          { href: `/admin/reservations?studentId=${encodeURIComponent(studentId)}`, label: "次回レッスンを確認" },
          { href: `/admin/lesson-notes?studentId=${encodeURIComponent(studentId)}`, label: "レッスンノートを見る" },
          { href: `/admin/homework?studentId=${encodeURIComponent(studentId)}`, label: "宿題を確認" },
          { href: `/admin/reservations?studentId=${encodeURIComponent(studentId)}`, label: "予約状況を見る" },
        ];

  if (!studentId) return null;

  return (
    <section className={detailStyles.flowSummaryCard}>
      <h3 className={detailStyles.flowSummaryTitle}>直近の学習の流れ（要約）</h3>
      <p className={adminStyles.smallMuted}>読み取り専用・直近データを短く表示します。</p>
      {loading ? <p className={adminStyles.smallMuted}>読み込み中…</p> : null}
      {err ? <p className={adminStyles.smallMuted}>{err}</p> : null}
      {!loading && !err ? (
        <>
          <div className={detailStyles.flowSummaryGrid}>
            <div>
              <p className={detailStyles.flowSummaryLabel}>直近3回のレッスン要約</p>
              <ul className={detailStyles.flowSummaryList}>
                {last3.length === 0 ? <li>データがありません。</li> : null}
                {last3.map((n) => (
                  <li key={n.id}>
                    <strong>{n.date || "—"}</strong> {truncate(n.summary || n.title, 120)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={detailStyles.flowSummaryLabel}>繰り返し注意（キーワード）</p>
              <p className={detailStyles.flowSummaryBody}>
                {repeatedHints.length > 0 ? repeatedHints.join("・") : "該当なし（直近ノート内の頻出語）"}
              </p>
            </div>
          </div>
          <div className={detailStyles.flowSummaryGrid}>
            <div>
              <p className={detailStyles.flowSummaryLabel}>直近の宿題</p>
              <ul className={detailStyles.flowSummaryList}>
                {recentHw.length === 0 ? <li>データがありません。</li> : null}
                {recentHw.map((h) => (
                  <li key={h.id}>
                    {h.lessonDate || "—"} / {statusJa(h.status)} — {truncate(h.title, 48)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={detailStyles.flowSummaryLabel}>次回レッスン（最新ノートの次回計画）</p>
              <p className={detailStyles.flowSummaryBody}>{latestNext || "—"}</p>
            </div>
          </div>
        </>
      ) : null}
      <div className={detailStyles.flowSummaryActions} aria-label="クイックアクション">
        <p className={detailStyles.flowSummaryActionsTitle}>次の行動</p>
        <div className={detailStyles.flowSummaryActionsRow}>
          {actionLinks.map((a) => (
            <Link key={a.href + a.label} className={detailStyles.flowSummaryActionBtn} href={a.href}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

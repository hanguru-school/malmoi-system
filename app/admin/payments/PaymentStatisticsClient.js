"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import payStyles from "./admin.payments.module.css";
import AdminTopNav from "../AdminTopNav";
import AdminPaymentsSubNav from "./AdminPaymentsSubNav";
import { jpPaymentStatus, jpStudentPaymentCategory } from "../../../lib/payments/receipt-labels.js";

function jstYmd(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(d);
}

function rangeForPreset(preset, customFrom, customTo) {
  const today = jstYmd();
  if (preset === "all") return { fromDate: "", toDate: "" };
  if (preset === "today") return { fromDate: today, toDate: today };
  if (preset === "week") {
    const t = new Date();
    const jst = new Date(t.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    jst.setDate(jst.getDate() - 6);
    const from = jstYmd(jst);
    return { fromDate: from, toDate: today };
  }
  if (preset === "month") {
    const [y, m] = today.split("-");
    const monthStart = `${y}-${m}-01`;
    return { fromDate: monthStart, toDate: today };
  }
  if (preset === "year") {
    const y = today.split("-")[0];
    return { fromDate: `${y}-01-01`, toDate: today };
  }
  if (preset === "custom") {
    return { fromDate: customFrom || "", toDate: customTo || "" };
  }
  return { fromDate: "", toDate: "" };
}

const fmtYen = (n) => `${new Intl.NumberFormat("ja-JP").format(Math.round(Number(n) || 0))}円`;

export default function PaymentStatisticsClient() {
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState("");

  const query = useMemo(() => rangeForPreset(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (query.fromDate) qs.set("fromDate", query.fromDate);
      if (query.toDate) qs.set("toDate", query.toDate);
      const res = await fetch(`/api/admin/payments/dashboard?${qs.toString()}`, { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "読み込み失敗");
      setData(json);
    } catch (e) {
      setError(e.message || "エラー");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query.fromDate, query.toDate]);

  useEffect(() => {
    load();
  }, [load]);

  const sendSummaryMail = useCallback(async (preset) => {
    setSummaryBusy(true);
    setSummaryMsg("");
    try {
      const res = await fetch("/api/admin/payments/summary-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "送信に失敗しました。");
      setSummaryMsg(
        preset === "today"
          ? "本日分の決済サマリーを教室宛に送信しました。"
          : preset === "week"
            ? "直近7日分の決済サマリーを教室宛に送信しました。"
            : "今月分の決済サマリーを教室宛に送信しました。",
      );
    } catch (e) {
      setSummaryMsg(e.message || "エラー");
    } finally {
      setSummaryBusy(false);
    }
  }, []);

  const sum = data?.sum;
  const byMethod = data?.byMethod || {};
  const studentRows = data?.studentRows || [];
  const transactions = data?.transactions || [];
  const transactionsTotal = data?.transactionsTotal ?? transactions.length;

  return (
    <div className={adminStyles.adminShell}>
      <main className={`${adminStyles.adminCard} ${payStyles.statSurface}`}>
        <div className={payStyles.statPageHead}>
          <div>
            <h1 className={styles.sectionTitle}>決済管理 — 統計</h1>
            <p className={payStyles.statLead}>
              保存済みの決済取引を期間で集計します（読み取り専用）。明細は最大 120 件表示（該当期間 {transactionsTotal} 件）。
            </p>
          </div>
        </div>
        <AdminTopNav currentPath="/admin/payments/statistics" />
        <AdminPaymentsSubNav />

        <div className={payStyles.segmentRow} role="group" aria-label="期間">
          {[
            { id: "today", label: "今日" },
            { id: "week", label: "直近7日" },
            { id: "month", label: "今月" },
            { id: "year", label: "今年" },
            { id: "custom", label: "期間指定" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={preset === p.id ? `${payStyles.segBtn} ${payStyles.segBtnOn}` : payStyles.segBtn}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" ? (
          <div className={payStyles.customRange}>
            <label className={payStyles.fieldCompact}>
              開始
              <input className={styles.input} type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </label>
            <label className={payStyles.fieldCompact}>
              終了
              <input className={styles.input} type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </label>
            <button type="button" className={styles.button} onClick={load}>
              再集計
            </button>
          </div>
        ) : null}
        <p className={adminStyles.smallMuted}>
          期間: {query.fromDate || "—"} ～ {query.toDate || "—"}（JST）
        </p>

        <section className={payStyles.cardBlock} style={{ marginTop: "0.75rem" }}>
          <h2 className={payStyles.cardBlockTitle}>決済サマリー通知（教室宛）</h2>
          <p className={payStyles.payHint} style={{ marginTop: 0 }}>
            保存済み取引の集計のみをメールします（再計算・データ変更は行いません）。件名は【決済日報】/【決済週報】などプリセットで切り替わります。
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className={payStyles.completionSecondary}
              style={{ margin: 0 }}
              disabled={summaryBusy}
              onClick={() => sendSummaryMail("today")}
            >
              {summaryBusy ? "送信中…" : "本日のサマリーを送信"}
            </button>
            <button
              type="button"
              className={payStyles.completionSecondary}
              style={{ margin: 0 }}
              disabled={summaryBusy}
              onClick={() => sendSummaryMail("week")}
            >
              {summaryBusy ? "送信中…" : "直近7日のサマリーを送信"}
            </button>
            <button
              type="button"
              className={payStyles.completionSecondary}
              style={{ margin: 0 }}
              disabled={summaryBusy}
              onClick={() => sendSummaryMail("month")}
            >
              {summaryBusy ? "送信中…" : "今月のサマリーを送信"}
            </button>
          </div>
          {summaryMsg ? (
            <p className={summaryMsg.includes("送信") ? payStyles.msgOk : payStyles.msgErr} style={{ marginTop: "0.65rem" }} role="status">
              {summaryMsg}
            </p>
          ) : null}
        </section>

        {loading ? <p className={payStyles.mutedBox}>読み込み中…</p> : null}
        {error ? (
          <p className={payStyles.errorBox} role="alert">
            {error}
          </p>
        ) : null}

        {!loading && sum ? (
          <>
            <div className={payStyles.kpiGrid}>
              <article className={payStyles.kpiCard}>
                <h2 className={payStyles.kpiLabel}>件数</h2>
                <p className={payStyles.kpiNum}>{sum.count}</p>
              </article>
              <article className={payStyles.kpiCard}>
                <h2 className={payStyles.kpiLabel}>税込売上</h2>
                <p className={payStyles.kpiNum}>{fmtYen(sum.amountTaxInclusive)}</p>
              </article>
              <article className={payStyles.kpiCard}>
                <h2 className={payStyles.kpiLabel}>税抜売上</h2>
                <p className={payStyles.kpiNumSm}>{fmtYen(sum.amountTaxExclusive)}</p>
              </article>
              <article className={payStyles.kpiCard}>
                <h2 className={payStyles.kpiLabel}>消費税</h2>
                <p className={payStyles.kpiNumSm}>{fmtYen(sum.taxAmount)}</p>
              </article>
              <article className={payStyles.kpiCard}>
                <h2 className={payStyles.kpiLabel}>付与ポイント計</h2>
                <p className={payStyles.kpiNum}>{new Intl.NumberFormat("ja-JP").format(sum.totalPoints)} pt</p>
              </article>
              <article className={payStyles.kpiCard}>
                <h2 className={payStyles.kpiLabel}>換算時間計</h2>
                <p className={payStyles.kpiNum}>{sum.totalMinutes} 分</p>
              </article>
              <article className={payStyles.kpiCard}>
                <h2 className={payStyles.kpiLabel}>手動含む件数</h2>
                <p className={payStyles.kpiNum}>{sum.manualGrantCount}</p>
              </article>
            </div>

            <section className={payStyles.cardBlock}>
              <h2 className={payStyles.cardBlockTitle}>支払方法別</h2>
              <ul className={payStyles.methodList}>
                {Object.entries(byMethod).map(([k, v]) => (
                  <li key={k} className={payStyles.methodItem}>
                    <span className={payStyles.methodName}>{k}</span>
                    <span className={payStyles.methodVal}>
                      {v.count} 件 / {fmtYen(v.amountTaxInclusive)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={payStyles.cardBlock}>
              <h2 className={payStyles.cardBlockTitle}>学生別（上位）</h2>
              <div className={adminStyles.tableWrap}>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>学生</th>
                      <th>番号</th>
                      <th>件数</th>
                      <th>税込計</th>
                      <th>ポイント</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.slice(0, 30).map((r) => (
                      <tr key={r.studentId}>
                        <td>
                          <Link className={adminStyles.inlineLink} href={`/admin/students/${r.studentId}`}>
                            {r.studentName}
                          </Link>
                        </td>
                        <td>{r.studentNumber}</td>
                        <td>{r.count}</td>
                        <td>{r.amountTaxInclusive}</td>
                        <td>{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={payStyles.cardBlock}>
              <h2 className={payStyles.cardBlockTitle}>期間内の決済一覧（最大200件）</h2>
              <div className={adminStyles.tableWrap}>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>日時</th>
                      <th>学生（詳細）</th>
                      <th>区分</th>
                      <th>状態</th>
                      <th>税込</th>
                      <th>方法</th>
                      <th>PT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{String(t.paidAt || "").slice(0, 16)}</td>
                        <td>
                          <Link className={adminStyles.inlineLink} href={`/admin/payments/transactions/${t.id}`}>
                            {t.studentNameSnapshot}
                          </Link>
                        </td>
                        <td>{jpStudentPaymentCategory(t)}</td>
                        <td>{jpPaymentStatus(t)}</td>
                        <td>{t.amountTaxInclusive}</td>
                        <td>{t.paymentMethod}</td>
                        <td>{t.finalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

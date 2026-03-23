"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import AdminTopNav from "../AdminTopNav";

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

export default function SalesDashboardClient() {
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => rangeForPreset(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (query.fromDate) qs.set("fromDate", query.fromDate);
      if (query.toDate) qs.set("toDate", query.toDate);
      const res = await fetch(`/api/admin/payments/dashboard?${qs.toString()}`);
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

  const sum = data?.sum;
  const byMethod = data?.byMethod || {};
  const studentRows = data?.studentRows || [];
  const transactions = data?.transactions || [];

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h1 className={styles.sectionTitle}>売上ダッシュボード</h1>
          <Link href="/admin/payments/input" className={adminStyles.inlineLink}>
            決済入力
          </Link>
        </div>
        <p className={styles.description}>保存済みの決済取引のみを集計します（読み取り専用）。</p>
        <AdminTopNav currentPath="/admin/sales-dashboard" />

        <div className={adminStyles.inlineActions} style={{ marginTop: "0.75rem", flexWrap: "wrap" }}>
          {[
            { id: "today", label: "今日" },
            { id: "week", label: "直近7日" },
            { id: "month", label: "今月" },
            { id: "year", label: "今年" },
            { id: "all", label: "全期間" },
            { id: "custom", label: "期間指定" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={preset === p.id ? `${adminStyles.chipButton} ${adminStyles.chipButtonActive}` : adminStyles.chipButton}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
            <label className={styles.label}>
              開始
              <input className={styles.input} type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </label>
            <label className={styles.label}>
              終了
              <input className={styles.input} type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </label>
            <button type="button" className={styles.button} onClick={load}>
              再集計
            </button>
          </div>
        ) : null}
        <p className={adminStyles.smallMuted}>
          期間: {query.fromDate || "—"} ～ {query.toDate || "—"}（JST基準の日付）
        </p>

        {loading ? <p>読み込み中…</p> : null}
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

        {!loading && sum ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "0.75rem",
                marginTop: "1rem",
              }}
            >
              <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div className={adminStyles.smallMuted}>件数</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{sum.count}</div>
              </div>
              <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div className={adminStyles.smallMuted}>税抜売上</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{sum.amountTaxExclusive}</div>
              </div>
              <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div className={adminStyles.smallMuted}>消費税</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{sum.taxAmount}</div>
              </div>
              <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div className={adminStyles.smallMuted}>税込売上</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{sum.amountTaxInclusive}</div>
              </div>
              <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div className={adminStyles.smallMuted}>付与ポイント計</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{sum.totalPoints}</div>
              </div>
              <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div className={adminStyles.smallMuted}>換算時間計</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{sum.totalMinutes} 分</div>
              </div>
              <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div className={adminStyles.smallMuted}>手動含む件数</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{sum.manualGrantCount}</div>
              </div>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: "1.25rem" }}>
              支払方法別
            </h2>
            <ul className={adminStyles.tableWrap} style={{ listStyle: "none", padding: "0.5rem" }}>
              {Object.entries(byMethod).map(([k, v]) => (
                <li key={k}>
                  {k}: {v.count} 件 / 税込 {v.amountTaxInclusive} 円
                </li>
              ))}
            </ul>

            <h2 className={styles.sectionTitle}>学生別（上位）</h2>
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

            <h2 className={styles.sectionTitle}>期間内の決済一覧（最大200件）</h2>
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>日時</th>
                    <th>学生</th>
                    <th>税込</th>
                    <th>方法</th>
                    <th>PT</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{String(t.paidAt || "").slice(0, 16)}</td>
                      <td>{t.studentNameSnapshot}</td>
                      <td>{t.amountTaxInclusive}</td>
                      <td>{t.paymentMethod}</td>
                      <td>{t.finalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

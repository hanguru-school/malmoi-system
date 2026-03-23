"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";
import payStyles from "./admin.payments.module.css";
import { jpPaymentStatus, jpStudentPaymentCategory } from "../../../lib/payments/receipt-labels.js";

function jstMonthRange() {
  const t = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
  const [y, m] = t.split("-");
  return { fromDate: `${y}-${m}-01`, toDate: t };
}

export default function PaymentHistoryClient() {
  const initialRange = jstMonthRange();
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventsError, setEventsError] = useState("");
  const [rebuildError, setRebuildError] = useState("");
  const [rebuild, setRebuild] = useState(null);
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [studentId, setStudentId] = useState("");
  const [asOf, setAsOf] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "200");
      if (fromDate) qs.set("fromDate", fromDate);
      if (toDate) qs.set("toDate", toDate);
      if (studentId.trim()) qs.set("studentId", studentId.trim());
      const res = await fetch(`/api/admin/payments/transactions?${qs.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "履歴の取得に失敗しました。");
      setItems(data.items || []);
    } catch (e) {
      setError(e.message || "エラー");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, studentId]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError("");
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "250");
      if (fromDate) qs.set("fromDate", fromDate);
      if (toDate) qs.set("toDate", toDate);
      if (studentId.trim()) qs.set("studentId", studentId.trim());
      const res = await fetch(`/api/admin/payments/events?${qs.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "イベント履歴の取得に失敗しました。");
      setEvents(data.items || []);
    } catch (e) {
      setEventsError(e.message || "エラー");
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [fromDate, toDate, studentId]);

  const runRebuild = useCallback(async () => {
    if (!studentId.trim()) {
      setRebuildError("復元確認には学生IDの入力が必要です。");
      setRebuild(null);
      return;
    }
    setRebuildLoading(true);
    setRebuildError("");
    try {
      const qs = new URLSearchParams();
      qs.set("studentId", studentId.trim());
      if (asOf.trim()) qs.set("asOf", asOf.trim());
      const res = await fetch(`/api/admin/payments/rebuild?${qs.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "復元シミュレーションに失敗しました。");
      setRebuild(data);
    } catch (e) {
      setRebuildError(e.message || "エラー");
      setRebuild(null);
    } finally {
      setRebuildLoading(false);
    }
  }, [asOf, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const thisMonth = () => {
    const t = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
    const [y, m] = t.split("-");
    setFromDate(`${y}-${m}-01`);
    setToDate(t);
  };

  return (
    <div className={payStyles.payHub}>
      <section className={payStyles.payCard}>
        <h2 className={payStyles.payCardTitle}>絞り込み</h2>
        <div className={payStyles.fieldGrid}>
          <div className={payStyles.fieldBox}>
            <span className={payStyles.fieldLab}>開始日</span>
            <input className={payStyles.bigInput} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className={payStyles.fieldBox}>
            <span className={payStyles.fieldLab}>終了日</span>
            <input className={payStyles.bigInput} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className={payStyles.fieldBox}>
            <span className={payStyles.fieldLab}>学生ID（任意）</span>
            <input
              className={payStyles.bigInput}
              placeholder="内部IDを貼り付け"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
        </div>
        <div className={payStyles.submitRow}>
          <button type="button" className={styles.button} onClick={thisMonth}>
            今月
          </button>
          <button type="button" className={styles.button} onClick={load} disabled={loading}>
            {loading ? "更新中…" : "再読込"}
          </button>
          <button type="button" className={styles.button} onClick={loadEvents} disabled={eventsLoading}>
            {eventsLoading ? "イベント更新中…" : "イベント更新"}
          </button>
        </div>
        <p className={payStyles.payHint}>初期表示は今月（JST）。期間を空にすると直近 {200} 件まで表示します。</p>
        {error ? (
          <p className={payStyles.msgErr} role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className={payStyles.payCard}>
        <h2 className={payStyles.payCardTitle}>決済履歴（{items.length} 件）</h2>
        {loading ? <p className={payStyles.payHint}>読み込み中…</p> : null}
        <div className={payStyles.historyList}>
          {items.map((t) => (
            <div key={t.id} className={payStyles.historyCard}>
              <div>
                <span className={payStyles.historyTime}>{String(t.paidAt || "").slice(0, 16)}</span>
                <span className={payStyles.historyWho}>{t.studentNameSnapshot}</span>
                <span className={payStyles.historyMeta}>
                  {jpStudentPaymentCategory(t)} · {jpPaymentStatus(t)}
                </span>
              </div>
              <div className={payStyles.historyNums}>
                <strong>税込 {t.amountTaxInclusive} 円</strong>
                <span>{t.finalPoints} pt</span>
                <span>{t.grantedMinutes ?? 0} 分</span>
                <span>{t.paymentMethod || "—"}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 0.75rem", marginTop: "0.35rem" }}>
                <Link className={payStyles.miniLink} href={`/admin/payments/transactions/${t.id}`}>
                  詳細
                </Link>
                <Link className={payStyles.miniLink} href={`/admin/payments/receipt/${t.id}?kind=receipt`}>
                  レシート
                </Link>
              </div>
            </div>
          ))}
        </div>
        {!loading && items.length === 0 ? <p className={payStyles.payHint}>該当する履歴がありません。</p> : null}
      </section>

      <section className={payStyles.payCard}>
        <h2 className={payStyles.payCardTitle}>イベント履歴（{events.length} 件）</h2>
        {eventsLoading ? <p className={payStyles.payHint}>読み込み中…</p> : null}
        {eventsError ? (
          <p className={payStyles.msgErr} role="alert">
            {eventsError}
          </p>
        ) : null}
        <div className={payStyles.historyList}>
          {events.map((ev) => (
            <div key={ev.id} className={payStyles.historyCard}>
              <div>
                <span className={payStyles.historyTime}>{String(ev.at || "").slice(0, 16)}</span>
                <span className={payStyles.historyWho}>{ev.eventType}</span>
                <span className={payStyles.historyMeta}>
                  学生ID: {ev.studentId || "-"} {ev.transactionId ? `· TX: ${ev.transactionId}` : ""}
                </span>
              </div>
              <div className={payStyles.historyNums}>
                <span>{ev.reason || "理由なし"}</span>
                <span>{ev.actorRole || "-"}</span>
                <span>{ev.isVoided ? "VOID" : "有効"}</span>
                <button
                  type="button"
                  className={payStyles.miniLinkBtn}
                  onClick={() => setSelectedEvent(ev)}
                >
                  スナップショット
                </button>
              </div>
            </div>
          ))}
        </div>
        {!eventsLoading && events.length === 0 ? <p className={payStyles.payHint}>該当するイベントがありません。</p> : null}
        {selectedEvent ? (
          <div className={payStyles.snapshotPanel}>
            <div className={payStyles.snapshotPanelHead}>
              <strong>イベント詳細: {selectedEvent.eventType}</strong>
              <button type="button" className={payStyles.miniLinkBtn} onClick={() => setSelectedEvent(null)}>
                閉じる
              </button>
            </div>
            <pre className={payStyles.snapshotPre}>
              {JSON.stringify(
                {
                  id: selectedEvent.id,
                  at: selectedEvent.at,
                  reason: selectedEvent.reason,
                  payloadSnapshot: selectedEvent.payloadSnapshot || null,
                  ruleSnapshot: selectedEvent.ruleSnapshot || null,
                  resultSnapshot: selectedEvent.resultSnapshot || null,
                },
                null,
                2
              )}
            </pre>
          </div>
        ) : null}
      </section>

      <section className={payStyles.payCard}>
        <h2 className={payStyles.payCardTitle}>復元シミュレーション（イベント基準）</h2>
        <p className={payStyles.payHint}>実データを変更せず、指定時点までのイベントで状態を再構成して差分を確認します。</p>
        <div className={payStyles.fieldGrid}>
          <div className={payStyles.fieldBox}>
            <span className={payStyles.fieldLab}>学生ID（必須）</span>
            <input
              className={payStyles.bigInput}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="内部ID"
            />
          </div>
          <div className={payStyles.fieldBox}>
            <span className={payStyles.fieldLab}>asOf（任意, ISO）</span>
            <input
              className={payStyles.bigInput}
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              placeholder="2026-03-23T23:59:59.000Z"
            />
          </div>
        </div>
        <div className={payStyles.submitRow}>
          <button type="button" className={styles.button} onClick={runRebuild} disabled={rebuildLoading}>
            {rebuildLoading ? "検証中…" : "復元シミュレーション実行"}
          </button>
        </div>
        {rebuildError ? (
          <p className={payStyles.msgErr} role="alert">
            {rebuildError}
          </p>
        ) : null}
        {rebuild ? (
          <div className={payStyles.rebuildGrid}>
            <article className={payStyles.rebuildCard}>
              <h3>Current</h3>
              <p>Points: {rebuild.current?.pointsBalance ?? 0}</p>
              <p>Total Minutes: {rebuild.current?.totalMinutes ?? 0}</p>
              <p>Used Minutes: {rebuild.current?.usedMinutes ?? 0}</p>
              <p>Remaining Minutes: {rebuild.current?.remainingMinutes ?? 0}</p>
            </article>
            <article className={payStyles.rebuildCard}>
              <h3>Simulated</h3>
              <p>Points: {rebuild.simulated?.pointsBalance ?? 0}</p>
              <p>Total Minutes: {rebuild.simulated?.totalMinutes ?? 0}</p>
              <p>Used Minutes: {rebuild.simulated?.usedMinutes ?? 0}</p>
              <p>Remaining Minutes: {rebuild.simulated?.remainingMinutes ?? 0}</p>
            </article>
            <article className={payStyles.rebuildCard}>
              <h3>Diff</h3>
              <p>Points: {rebuild.diff?.pointsBalance ?? 0}</p>
              <p>Total Minutes: {rebuild.diff?.totalMinutes ?? 0}</p>
              <p>Used Minutes: {rebuild.diff?.usedMinutes ?? 0}</p>
              <p>Remaining Minutes: {rebuild.diff?.remainingMinutes ?? 0}</p>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";
import payStyles from "./admin.payments.module.css";
import { jpPaymentStatus, jpStudentPaymentCategory } from "../../../lib/payments/receipt-labels.js";

const PAY_METHODS = ["現金", "カード", "振込", "その他"];

export default function PaymentInputClient() {
  const [q, setQ] = useState("");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("payment");
  const [inputAmount, setInputAmount] = useState("");
  const [taxInputMode, setTaxInputMode] = useState("inclusive");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState("");
  const [manualPoints, setManualPoints] = useState("0");
  const [manualReason, setManualReason] = useState("");
  const [pointGrantCategory, setPointGrantCategory] = useState("手動付与");
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recent, setRecent] = useState([]);
  const [msg, setMsg] = useState("");
  const [completion, setCompletion] = useState(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const previewSeq = useRef(0);

  const [adjSubtype, setAdjSubtype] = useState("manual");
  const [adjDeltaPoints, setAdjDeltaPoints] = useState("");
  const [adjDeltaMinutes, setAdjDeltaMinutes] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjRelatedId, setAdjRelatedId] = useState("");
  const [adjPaidAt, setAdjPaidAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [adjNote, setAdjNote] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjMsg, setAdjMsg] = useState("");

  const loadStudents = useCallback(async () => {
    const res = await fetch(`/api/admin/payments/students?q=${encodeURIComponent(q)}`, {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.ok) setStudents(data.students || []);
  }, [q]);

  const loadRecent = useCallback(async () => {
    const res = await fetch("/api/admin/payments/transactions?limit=20", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.ok) setRecent(data.items || []);
  }, []);

  useEffect(() => {
    const t = setTimeout(loadStudents, 200);
    return () => clearTimeout(t);
  }, [loadStudents]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const previewBody = useMemo(
    () => ({
      studentId: selected?.id,
      transactionKind: mode === "point_grant" ? "point_grant" : "payment",
      taxInputMode,
      inputAmountYen: Number(inputAmount || 0),
      manualPoints: Number(manualPoints || 0),
      manualReason,
      paidAt: new Date(paidAt).toISOString(),
    }),
    [selected?.id, mode, taxInputMode, inputAmount, manualPoints, manualReason, paidAt],
  );

  useEffect(() => {
    if (!selected?.id) {
      setPreview(null);
      return;
    }
    const seq = ++previewSeq.current;
    const t = setTimeout(async () => {
      setPreviewLoading(true);
      setMsg("");
      try {
        const res = await fetch("/api/admin/payments/preview", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(previewBody),
        });
        const data = await res.json();
        if (seq !== previewSeq.current) return;
        if (!data.ok) throw new Error(data.error || "プレビュー失敗");
        setPreview(data);
      } catch (e) {
        if (seq === previewSeq.current) {
          setPreview(null);
          setMsg(e.message || "計算エラー");
        }
      } finally {
        if (seq === previewSeq.current) setPreviewLoading(false);
      }
    }, 420);
    return () => clearTimeout(t);
  }, [previewBody, selected?.id]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/payments/commit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          transactionKind: mode === "point_grant" ? "point_grant" : "payment",
          taxInputMode,
          inputAmountYen: Number(inputAmount || 0),
          manualPoints: Number(manualPoints || 0),
          manualReason,
          paidAt: new Date(paidAt).toISOString(),
          paymentMethod,
          note,
          pointGrantCategory: mode === "point_grant" ? pointGrantCategory : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "登録失敗");
      setMsg("");
      setCompletion({
        transaction: data.transaction,
        studentAfter: data.studentAfter || null,
        mails: data.mails || {},
        completionLogId: data.completionLogId || null,
      });
      setResendMsg("");
      previewSeq.current += 1;
      loadRecent();
    } catch (e) {
      setMsg(e.message || "エラー");
    } finally {
      setSaving(false);
    }
  }

  const calc = preview?.calc;

  async function saveAdjustment() {
    if (!selected) return;
    setAdjSaving(true);
    setAdjMsg("");
    try {
      const res = await fetch("/api/admin/payments/adjustment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          adjustmentSubtype: adjSubtype,
          deltaPoints: Number(adjDeltaPoints || 0),
          deltaMinutes: Number(adjDeltaMinutes || 0),
          amountTaxInclusive: Number(adjAmount || 0),
          relatedTransactionId: adjSubtype === "reversal" ? String(adjRelatedId || "").trim() : "",
          paidAt: new Date(adjPaidAt).toISOString(),
          note: adjNote,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "登録失敗");
      setAdjMsg("調整を登録しました（新規取引として保存）。");
      loadRecent();
    } catch (e) {
      setAdjMsg(e.message || "エラー");
    } finally {
      setAdjSaving(false);
    }
  }

  async function resendMails(scope) {
    const tid = completion?.transaction?.id;
    if (!tid) return;
    setResendBusy(true);
    setResendMsg("");
    try {
      const res = await fetch(`/api/admin/payments/transactions/${encodeURIComponent(tid)}/resend`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: scope || "both" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "再送に失敗しました。");
      setResendMsg(
        scope === "student"
          ? "学生向けメールを再送しました。"
          : scope === "office"
            ? "教室向け記録メールを再送しました。"
            : "通知メールを再送しました。",
      );
    } catch (e) {
      setResendMsg(e.message || "エラー");
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <div className={payStyles.payHub}>
      <section className={payStyles.payCard} aria-labelledby="pay-search-title">
        <h2 id="pay-search-title" className={payStyles.payCardTitle}>
          学生検索
        </h2>
        <input
          className={payStyles.paySearchInput}
          placeholder="名前・フリガナ・学生番号・電話で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        <div className={payStyles.studentGrid}>
          {students.map((s) => (
            <button
              key={s.id}
              type="button"
              className={selected?.id === s.id ? `${payStyles.studentCard} ${payStyles.studentCardOn}` : payStyles.studentCard}
              onClick={() => {
                setSelected(s);
                setMsg("");
              }}
            >
              <span className={payStyles.studentName}>{s.nameKanji}</span>
              <span className={payStyles.studentNum}>{s.studentNumber}</span>
              <span className={payStyles.studentMeta}>
                {s.currentRuleLabel || "—"} / {s.points?.balance ?? 0} pt / 残{s.lessonMinutes?.remainingMinutes ?? 0}分
              </span>
            </button>
          ))}
        </div>
        {students.length === 0 ? <p className={payStyles.payHint}>検索すると候補が表示されます。</p> : null}
      </section>

      {selected ? (
        <section className={payStyles.payCard} aria-label="選択された学生">
          <h2 className={payStyles.payCardTitle}>選択中の学生</h2>
          <div className={payStyles.selectedBanner}>
            <div>
              <p className={payStyles.selectedMain}>{selected.nameKanji}</p>
              <p className={payStyles.selectedSub}>
                {selected.studentNumber} · {selected.currentRuleLabel || "ルール未設定"}
              </p>
            </div>
            <Link className={payStyles.miniLink} href={`/admin/students/${selected.id}`}>
              学生詳細
            </Link>
          </div>
        </section>
      ) : null}

      {selected ? (
        <section className={payStyles.payCard} aria-label="調整">
          <h2 className={payStyles.payCardTitle}>調整・取消（新規取引）</h2>
          <p className={payStyles.payHint}>既存データは変更せず、相殺・減算はすべて新しい取引として記録されます。</p>
          <div className={payStyles.modeRow} role="group">
            <button
              type="button"
              className={adjSubtype === "manual" ? `${payStyles.modeBtn} ${payStyles.modeBtnOn}` : payStyles.modeBtn}
              onClick={() => setAdjSubtype("manual")}
            >
              手動調整
            </button>
            <button
              type="button"
              className={adjSubtype === "reversal" ? `${payStyles.modeBtn} ${payStyles.modeBtnOn}` : payStyles.modeBtn}
              onClick={() => setAdjSubtype("reversal")}
            >
              取引取消（相殺）
            </button>
          </div>
          {adjSubtype === "reversal" ? (
            <div className={payStyles.fieldBox}>
              <span className={payStyles.fieldLab}>取消対象の決済ID</span>
              <input
                className={payStyles.bigInput}
                placeholder="履歴の決済IDを貼り付け"
                value={adjRelatedId}
                onChange={(e) => setAdjRelatedId(e.target.value)}
              />
            </div>
          ) : (
            <div className={payStyles.fieldGrid}>
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>ポイント増減（マイナス可）</span>
                <input
                  className={payStyles.bigInput}
                  type="number"
                  inputMode="numeric"
                  value={adjDeltaPoints}
                  onChange={(e) => setAdjDeltaPoints(e.target.value)}
                />
              </div>
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>時間増減・分（マイナス可）</span>
                <input
                  className={payStyles.bigInput}
                  type="number"
                  inputMode="numeric"
                  value={adjDeltaMinutes}
                  onChange={(e) => setAdjDeltaMinutes(e.target.value)}
                />
              </div>
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>金額修正・円（マイナス可・税込扱い）</span>
                <input
                  className={payStyles.bigInput}
                  type="number"
                  inputMode="numeric"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className={payStyles.fieldGrid}>
            <div className={payStyles.fieldBox}>
              <span className={payStyles.fieldLab}>記録日時</span>
              <input className={payStyles.bigInput} type="datetime-local" value={adjPaidAt} onChange={(e) => setAdjPaidAt(e.target.value)} />
            </div>
            <div className={payStyles.fieldBox}>
              <span className={payStyles.fieldLab}>メモ</span>
              <input className={payStyles.bigInput} value={adjNote} onChange={(e) => setAdjNote(e.target.value)} />
            </div>
          </div>
          <div className={payStyles.submitRow}>
            <button type="button" className={styles.button} onClick={saveAdjustment} disabled={adjSaving}>
              {adjSaving ? "登録中…" : "調整を登録"}
            </button>
          </div>
          {adjMsg ? (
            <p className={adjMsg.includes("登録") ? payStyles.msgOk : payStyles.msgErr} role="status">
              {adjMsg}
            </p>
          ) : null}
        </section>
      ) : null}

      {selected ? (
        <>
          <section className={payStyles.payCard}>
            <h2 className={payStyles.payCardTitle}>処理内容</h2>
            <div className={payStyles.modeRow} role="group" aria-label="モード">
              <button
                type="button"
                className={mode === "payment" ? `${payStyles.modeBtn} ${payStyles.modeBtnOn}` : payStyles.modeBtn}
                onClick={() => setMode("payment")}
              >
                決済
              </button>
              <button
                type="button"
                className={mode === "point_grant" ? `${payStyles.modeBtn} ${payStyles.modeBtnOn}` : payStyles.modeBtn}
                onClick={() => setMode("point_grant")}
              >
                ポイント付与
              </button>
            </div>

            {mode === "payment" ? (
              <div className={payStyles.fieldGrid}>
                <div className={payStyles.fieldBox}>
                  <span className={payStyles.fieldLab}>決済金額（円）</span>
                  <input
                    className={payStyles.bigInput}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                  />
                </div>
                <div className={payStyles.fieldBox}>
                  <span className={payStyles.fieldLab}>税の入力</span>
                  <div className={payStyles.chipRow}>
                    <button
                      type="button"
                      className={taxInputMode === "inclusive" ? `${payStyles.chip} ${payStyles.chipOn}` : payStyles.chip}
                      onClick={() => setTaxInputMode("inclusive")}
                    >
                      税込
                    </button>
                    <button
                      type="button"
                      className={taxInputMode === "exclusive" ? `${payStyles.chip} ${payStyles.chipOn}` : payStyles.chip}
                      onClick={() => setTaxInputMode("exclusive")}
                    >
                      税抜
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>区分</span>
                <select
                  className={payStyles.selectLike}
                  value={pointGrantCategory}
                  onChange={(e) => setPointGrantCategory(e.target.value)}
                >
                  <option value="手動付与">手動付与</option>
                  <option value="イベント付与">イベント付与</option>
                  <option value="調整">調整</option>
                  <option value="補填">補填</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            )}

            <div className={payStyles.fieldGrid}>
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>支払方法</span>
                <div className={payStyles.chipRowWrap}>
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={paymentMethod === m ? `${payStyles.chip} ${payStyles.chipOn}` : payStyles.chip}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>決済日時</span>
                <input
                  className={payStyles.bigInput}
                  type="datetime-local"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </div>
            </div>

            <div className={payStyles.fieldBox}>
              <span className={payStyles.fieldLab}>備考</span>
              <textarea className={payStyles.noteArea} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className={payStyles.fieldGrid}>
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>追加ポイント</span>
                <input
                  className={payStyles.bigInput}
                  type="number"
                  min={0}
                  value={manualPoints}
                  onChange={(e) => setManualPoints(e.target.value)}
                />
              </div>
              <div className={payStyles.fieldBox}>
                <span className={payStyles.fieldLab}>追加理由</span>
                <input className={payStyles.bigInput} value={manualReason} onChange={(e) => setManualReason(e.target.value)} />
              </div>
            </div>

            <div className={payStyles.submitRow}>
              <button type="button" className={styles.button} onClick={save} disabled={saving}>
                {saving ? "登録中…" : mode === "payment" ? "決済を登録" : "ポイントを付与"}
              </button>
            </div>
            <p className={payStyles.payHint}>金額・税・追加ポイントを変えると、下の計算が自動で更新されます。</p>
            {msg ? (
              <p className={msg.includes("登録") ? payStyles.msgOk : payStyles.msgErr} role="status">
                {msg}
              </p>
            ) : null}
          </section>

          <section className={`${payStyles.payCard} ${payStyles.calcCard}`} aria-live="polite">
            <h2 className={payStyles.payCardTitle}>計算結果</h2>
            {previewLoading ? <p className={payStyles.payHint}>計算中…</p> : null}
            {!previewLoading && calc ? (
              <dl className={payStyles.calcDl}>
                <div className={payStyles.calcRow}>
                  <dt>適用ルール</dt>
                  <dd>
                    {preview?.resolvedLayer === "individual" ? "個別" : preview?.resolvedLayer === "bulk" ? "一括" : "基本"}
                  </dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>税抜</dt>
                  <dd className={payStyles.calcEm}>{calc.tax?.amountTaxExclusive} 円</dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>消費税</dt>
                  <dd className={payStyles.calcEm}>{calc.tax?.taxAmount} 円</dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>税込</dt>
                  <dd className={payStyles.calcHero}>{calc.tax?.amountTaxInclusive} 円</dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>基本付与</dt>
                  <dd>{calc.basePoints} pt</dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>ボーナス</dt>
                  <dd>{calc.bonusPoints} pt</dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>手動追加</dt>
                  <dd>{calc.manualPoints} pt</dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>最終付与</dt>
                  <dd className={payStyles.calcHero}>{calc.finalPoints} pt</dd>
                </div>
                <div className={payStyles.calcRow}>
                  <dt>換算時間（今回）</dt>
                  <dd className={payStyles.calcEm}>{calc.grantedMinutes} 分</dd>
                </div>
              </dl>
            ) : null}
            {!previewLoading && !calc && selected ? (
              <p className={payStyles.payHint}>条件を入力すると計算結果が表示されます。</p>
            ) : null}
          </section>
        </>
      ) : null}

      {completion?.transaction ? (
        <div className={payStyles.completionOverlay} role="dialog" aria-modal="true" aria-labelledby="pay-done-title">
          <div className={payStyles.completionCard}>
            <p className={payStyles.completionBadge}>成功</p>
            <h2 id="pay-done-title" className={payStyles.completionTitle}>
              {completion.transaction.transactionKind === "point_grant"
                ? "ポイント付与を登録しました"
                : "お支払いの登録が完了しました"}
            </h2>
            <p className={payStyles.completionLead}>
              以下は保存済みの確定データです（再計算は行っていません）。メール送信は環境設定によりログのみの場合があります。
            </p>
            <dl className={payStyles.completionDl}>
              <div className={payStyles.completionRow}>
                <dt>学生名</dt>
                <dd>{completion.studentAfter?.nameKanji || completion.transaction.studentNameSnapshot || "—"}</dd>
              </div>
              <div className={payStyles.completionRow}>
                <dt>決済金額（税込）</dt>
                <dd className={payStyles.completionHero}>{completion.transaction.amountTaxInclusive ?? 0} 円</dd>
              </div>
              <div className={payStyles.completionRow}>
                <dt>お支払い方法</dt>
                <dd>{completion.transaction.paymentMethod || "—"}</dd>
              </div>
              <div className={payStyles.completionRow}>
                <dt>付与ポイント</dt>
                <dd className={payStyles.completionHero}>{completion.transaction.finalPoints ?? 0} pt</dd>
              </div>
              <div className={payStyles.completionRow}>
                <dt>換算時間（今回）</dt>
                <dd className={payStyles.completionHero}>{completion.transaction.grantedMinutes ?? 0} 分</dd>
              </div>
              <div className={payStyles.completionRow}>
                <dt>現在ポイント</dt>
                <dd>{completion.studentAfter?.pointsBalance ?? "—"} pt</dd>
              </div>
              <div className={payStyles.completionRow}>
                <dt>現在残り時間</dt>
                <dd>{completion.studentAfter?.remainingMinutes ?? "—"} 分</dd>
              </div>
              <div className={payStyles.completionRow}>
                <dt>決済ID</dt>
                <dd style={{ fontSize: "0.82rem", wordBreak: "break-all" }}>{completion.transaction.id}</dd>
              </div>
            </dl>
            <p className={payStyles.completionMeta}>
              メール: 学生 {completion.mails?.studentSent ? "送信" : "未送信/ログ"} / 教室 {completion.mails?.officeSent ? "送信" : "未送信/ログ"}
            </p>
            {resendMsg ? <p className={resendMsg.includes("再送") ? payStyles.msgOk : payStyles.msgErr}>{resendMsg}</p> : null}
            <div className={payStyles.completionActions}>
              <a
                className={payStyles.completionPrimary}
                href={`/admin/payments/receipt/${completion.transaction.id}?kind=receipt`}
                target="_blank"
                rel="noreferrer"
              >
                レシートを見る
              </a>
              <a
                className={payStyles.completionSecondary}
                href={`/admin/payments/receipt/${completion.transaction.id}?kind=ryoshu`}
                target="_blank"
                rel="noreferrer"
              >
                領収書を発行
              </a>
              <a
                className={payStyles.completionSecondary}
                href={`/api/admin/payments/receipt/${completion.transaction.id}/pdf`}
                download
              >
                PDF（レシート）
              </a>
              <a
                className={payStyles.completionSecondary}
                href={`/api/admin/payments/receipt/${completion.transaction.id}/pdf?kind=ryoshu`}
                download
              >
                PDF（領収書）
              </a>
              <button type="button" className={payStyles.completionSecondary} disabled={resendBusy} onClick={() => resendMails("student")}>
                {resendBusy ? "再送中…" : "学生にメール再送"}
              </button>
              <button type="button" className={payStyles.completionSecondary} disabled={resendBusy} onClick={() => resendMails("office")}>
                {resendBusy ? "再送中…" : "教室に記録メール再送"}
              </button>
              <button type="button" className={payStyles.completionSecondary} onClick={() => resendMails("both")} disabled={resendBusy}>
                両方まとめて再送
              </button>
              <button
                type="button"
                className={payStyles.completionClose}
                onClick={() => {
                  setCompletion(null);
                  setPreview(null);
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={payStyles.payCard}>
        <h2 className={payStyles.payCardTitle}>最近の決済履歴</h2>
        <p className={payStyles.payHint}>各行から詳細・レシート・領収書へ進めます。</p>
        <div className={payStyles.historyList}>
          {recent.map((t) => (
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
              {t.id ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 0.75rem", marginTop: "0.35rem" }}>
                  <Link className={payStyles.miniLink} href={`/admin/payments/transactions/${t.id}`}>
                    詳細
                  </Link>
                  <Link className={payStyles.miniLink} href={`/admin/payments/receipt/${t.id}?kind=receipt`}>
                    レシート
                  </Link>
                  <Link className={payStyles.miniLink} href={`/admin/payments/receipt/${t.id}?kind=ryoshu`}>
                    領収書
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {recent.length === 0 ? <p className={payStyles.payHint}>履歴がありません。</p> : null}
      </section>
    </div>
  );
}

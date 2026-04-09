"use client";

/**
 * 教室営業 — 完全クリックUI（JSON / textarea なし）
 * 保存は既存 classroomOperations 形へ変換（予約エンジン互換）
 *
 * 再利用: readOnly モード / 週次要約は features/.../ClassroomHoursWeekSummary
 */

import { useCallback, useMemo, useState } from "react";
import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import s from "./classroom-hours-visual-panel.module.css";
import {
  TIME_OPTIONS_5,
  WEEKDAY_LABEL_JA,
  WEEKDAY_ORDER_TOKYO,
} from "../../../../lib/reservations/scheduleVisualShared.js";
import { getClassroomDaySchedule } from "../../../../lib/reservations/classroomSchedule.js";
import {
  fromClassroomOperations,
  toClassroomOperationsPatch,
  setWeekdayInModel,
} from "../../../../lib/reservations/classroomHoursUIModel.js";

const TIME_OPTIONS = [...TIME_OPTIONS_5];
if (!TIME_OPTIONS.includes("23:59")) TIME_OPTIONS.push("23:59");

function todayYmdTokyo() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function padMonthDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const daysInMonth = last.getDate();
  let startDow = first.getDay();
  startDow = (startDow + 6) % 7;
  const cells = [];
  for (let i = 0; i < startDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  return cells;
}

function ymd(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeOverride(raw) {
  if (!raw || typeof raw !== "object") return null;
  const date = String(raw.date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (raw.type === "closed" || raw.closed === true) return { ...raw, date, type: "closed" };
  if (raw.type === "short" || (raw.open && raw.close && raw.type !== "special")) {
    return {
      ...raw,
      date,
      type: "short",
      open: raw.open || raw.start || "10:00",
      close: raw.close || raw.end || "19:00",
      breaks: Array.isArray(raw.breaks) ? raw.breaks : [],
    };
  }
  if (raw.type === "special") {
    return {
      ...raw,
      date,
      type: "special",
      open: raw.open || raw.start || "10:00",
      close: raw.close || raw.end || "19:00",
      breaks: Array.isArray(raw.breaks) ? raw.breaks : [],
    };
  }
  if (raw.open || raw.start || raw.close || raw.end) {
    return {
      ...raw,
      date,
      type: "short",
      open: raw.open || raw.start || "10:00",
      close: raw.close || raw.end || "19:00",
      breaks: Array.isArray(raw.breaks) ? raw.breaks : [],
    };
  }
  return { ...raw, date, type: "closed" };
}

function exStyle(type) {
  if (type === "closed") return s.calCellClosed;
  if (type === "short") return s.calCellShort;
  if (type === "special") return s.calCellSpecial;
  return "";
}

function ruleForWd(model, wd) {
  const w = model.weekdays[String(wd)];
  if (w?.closed) return { closed: true, open: model.open, close: model.close, breaks: [] };
  return {
    closed: false,
    open: w?.open || model.open,
    close: w?.close || model.close,
    breaks: Array.isArray(w?.breaks) ? w.breaks : [],
  };
}

export default function ClassroomHoursVisualPanel({
  initialClassroomOperations = {},
  initialSchoolBasic = {},
  adminRank = "ADMIN",
  readOnly = false,
}) {
  const [model, setModel] = useState(() =>
    fromClassroomOperations(initialClassroomOperations, initialSchoolBasic)
  );
  const [status, setStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState("weekly");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [groupMode, setGroupMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState(() => new Set());
  const [panel, setPanel] = useState(null);

  const coForPreview = useMemo(() => toClassroomOperationsPatch(model), [model]);
  const today = todayYmdTokyo();
  const todaySched = useMemo(() => getClassroomDaySchedule(coForPreview, today), [coForPreview, today]);

  const overridesByDate = useMemo(() => {
    const m = new Map();
    for (const raw of model.exceptions || []) {
      const o = normalizeOverride(raw);
      if (o) m.set(o.date, o);
    }
    return m;
  }, [model.exceptions]);

  const updateExceptions = useCallback((nextList) => {
    setModel((m) => ({ ...m, exceptions: nextList }));
  }, []);

  const setWeekday = useCallback((wd, rule) => {
    setModel((m) => setWeekdayInModel(m, wd, rule));
  }, []);

  function copyMondayToWeekdays() {
    const mon = ruleForWd(model, 1);
    let next = { ...model.weekdays };
    for (const wd of [2, 3, 4, 5]) {
      next[String(wd)] = mon.closed ? { closed: true } : { closed: false, open: mon.open, close: mon.close, breaks: [...(mon.breaks || [])] };
    }
    setModel((m) => ({ ...m, weekdays: next }));
  }

  function weekdaysOn() {
    let next = { ...model.weekdays };
    for (const wd of [1, 2, 3, 4, 5]) {
      const r = ruleForWd(model, wd);
      next[String(wd)] = { closed: false, open: r.open, close: r.close, breaks: r.breaks || [] };
    }
    setModel((m) => ({ ...m, weekdays: next }));
  }

  function weekendOff() {
    let next = { ...model.weekdays };
    for (const wd of [0, 6]) {
      next[String(wd)] = { closed: true };
    }
    setModel((m) => ({ ...m, weekdays: next }));
  }

  function openPanelForDates(dateStrs) {
    const sorted = [...dateStrs].sort();
    const first = sorted[0];
    const existing = first ? overridesByDate.get(first) : null;
    setPanel({
      dates: sorted,
      type: existing?.type === "closed" ? "closed" : existing?.type === "special" ? "special" : existing ? "short" : "closed",
      open: existing?.open || model.open,
      close: existing?.close || model.close,
      breaks: Array.isArray(existing?.breaks) ? [...existing.breaks] : [],
    });
  }

  function savePanel() {
    if (!panel) return;
    let next = (model.exceptions || []).filter((x) => {
      const d = normalizeOverride(x);
      return d && !panel.dates.includes(d.date);
    });
    for (const dStr of panel.dates) {
      if (panel.type === "closed") {
        next.push({ date: dStr, type: "closed", closed: true });
      } else {
        next.push({
          date: dStr,
          type: panel.type,
          open: panel.open,
          close: panel.close,
          breaks: panel.breaks,
        });
      }
    }
    updateExceptions(next);
    setPanel(null);
    setSelectedDates(new Set());
  }

  function deletePanelDates() {
    if (!panel) return;
    const next = (model.exceptions || []).filter((x) => {
      const d = normalizeOverride(x);
      return d && !panel.dates.includes(d.date);
    });
    updateExceptions(next);
    setPanel(null);
    setSelectedDates(new Set());
  }

  function togglePick(dateStr) {
    setSelectedDates((prev) => {
      const n = new Set(prev);
      if (n.has(dateStr)) n.delete(dateStr);
      else n.add(dateStr);
      return n;
    });
  }

  function onCalendarClick(dateStr) {
    if (!dateStr || readOnly) return;
    if (groupMode) {
      togglePick(dateStr);
      return;
    }
    openPanelForDates([dateStr]);
  }

  async function onSave() {
    if (readOnly) return;
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const patch = toClassroomOperationsPatch(model, initialSchoolBasic);
      const response = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "classroomOperations", patch }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "保存に失敗しました。");
      setModel(fromClassroomOperations(data.result?.settings || patch, initialSchoolBasic || {}));
      setStatus({ type: "success", text: "営業時間を保存しました。" });
    } catch (e) {
      setStatus({ type: "error", text: e?.message || "エラー" });
    } finally {
      setSaving(false);
    }
  }

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  return (
    <section className={adminStyles.sectionBlock}>
      {readOnly ? <p className={s.readOnlyBanner}>閲覧のみ（変更は管理者画面から行います）</p> : null}
      <p className={adminStyles.smallMuted}>権限: {adminRank}</p>
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>{status.text}</p>
      ) : null}

      <div className={s.root}>
        <div className={s.hero}>
          <h3 className={s.heroTitle}>基本営業（テンプレート）</h3>
          <p className={s.heroHint}>
            優先度: <strong>特別日</strong> ＞ <strong>曜日</strong> ＞ ここで設定した開始・終了・休憩。今日の解決結果は下に表示します。
          </p>
          <div className={s.row2}>
            <div>
              <span className={s.fieldLabel}>開始</span>
              <select
                className={s.select}
                disabled={readOnly}
                value={model.open}
                onChange={(e) => setModel((m) => ({ ...m, open: e.target.value }))}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={s.fieldLabel}>終了</span>
              <select
                className={s.select}
                disabled={readOnly}
                value={model.close}
                onChange={(e) => setModel((m) => ({ ...m, close: e.target.value }))}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={s.breakBlock}>
            <p className={s.breakTitle}>基本・休憩（全曜日に加算）</p>
            {(model.breaks || []).map((br, idx) => (
              <div key={idx} className={s.breakRow}>
                <select
                  className={s.select}
                  style={{ flex: 1, minWidth: "100px" }}
                  disabled={readOnly}
                  value={br.start || "12:00"}
                  onChange={(e) => {
                    const nb = [...model.breaks];
                    nb[idx] = { ...nb[idx], start: e.target.value };
                    setModel((m) => ({ ...m, breaks: nb }));
                  }}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span>〜</span>
                <select
                  className={s.select}
                  style={{ flex: 1, minWidth: "100px" }}
                  disabled={readOnly}
                  value={br.end || "13:00"}
                  onChange={(e) => {
                    const nb = [...model.breaks];
                    nb[idx] = { ...nb[idx], end: e.target.value };
                    setModel((m) => ({ ...m, breaks: nb }));
                  }}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {!readOnly ? (
                  <button
                    type="button"
                    className={s.btnDanger}
                    title="削除"
                    onClick={() => setModel((m) => ({ ...m, breaks: m.breaks.filter((_, i) => i !== idx) }))}
                  >
                    🗑
                  </button>
                ) : null}
              </div>
            ))}
            {!readOnly ? (
              <button
                type="button"
                className={s.btnGhost}
                onClick={() => setModel((m) => ({ ...m, breaks: [...(m.breaks || []), { start: "12:00", end: "13:00" }] }))}
              >
                ＋ 休憩を追加
              </button>
            ) : null}
          </div>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "#475569" }}>
            <strong>今日（東京）</strong> {today} —{" "}
            {todaySched.closed ? "休業" : `営業（枠あり） / 休憩 ${(todaySched.breaks || []).length} 件`}
          </p>
        </div>

        <div className={s.subTabs}>
          <button
            type="button"
            className={`${s.subTab} ${subTab === "weekly" ? s.subTabActive : ""}`}
            onClick={() => setSubTab("weekly")}
          >
            曜日別スケジュール
          </button>
          <button
            type="button"
            className={`${s.subTab} ${subTab === "exceptions" ? s.subTabActive : ""}`}
            onClick={() => setSubTab("exceptions")}
          >
            特別日・カレンダー
          </button>
        </div>

        {subTab === "weekly" ? (
          <>
            {!readOnly ? (
              <div className={s.toolbar}>
                <button type="button" className={s.btnGhost} onClick={copyMondayToWeekdays}>
                  月曜を火〜金にコピー
                </button>
                <button type="button" className={s.btnGhost} onClick={weekdaysOn}>
                  平日を営業ON
                </button>
                <button type="button" className={s.btnGhost} onClick={weekendOff}>
                  土日を休業
                </button>
              </div>
            ) : null}
            <div className={s.cardGrid}>
              {WEEKDAY_ORDER_TOKYO.map((wd) => {
                const r = ruleForWd(model, wd);
                return (
                  <div key={wd} className={s.dayCard}>
                    <div className={s.dayHead}>
                      <span className={s.dayLabel}>{WEEKDAY_LABEL_JA[wd]}</span>
                      <button
                        type="button"
                        className={`${s.toggle} ${!r.closed ? s.toggleOn : ""}`}
                        disabled={readOnly}
                        aria-pressed={!r.closed}
                        onClick={() => {
                          if (readOnly) return;
                          if (r.closed) {
                            setWeekday(wd, { closed: false, open: model.open, close: model.close, breaks: [] });
                          } else {
                            setWeekday(wd, { closed: true });
                          }
                        }}
                      >
                        <span className={s.toggleKnob} />
                      </button>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{r.closed ? "休業" : "営業"}</span>
                    </div>
                    {!r.closed ? (
                      <>
                        <div className={s.timeRow}>
                          <span className={s.fieldLabel} style={{ margin: 0 }}>
                            開始
                          </span>
                          <select
                            className={s.select}
                            style={{ width: "auto", minWidth: "110px" }}
                            disabled={readOnly}
                            value={r.open}
                            onChange={(e) =>
                              setWeekday(wd, { closed: false, open: e.target.value, close: r.close, breaks: r.breaks })
                            }
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <span className={s.fieldLabel} style={{ margin: 0 }}>
                            終了
                          </span>
                          <select
                            className={s.select}
                            style={{ width: "auto", minWidth: "110px" }}
                            disabled={readOnly}
                            value={r.close}
                            onChange={(e) =>
                              setWeekday(wd, { closed: false, open: r.open, close: e.target.value, breaks: r.breaks })
                            }
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={s.breakBlock}>
                          <p className={s.breakTitle}>この曜日の休憩</p>
                          {(r.breaks || []).map((br, idx) => (
                            <div key={idx} className={s.breakRow}>
                              <select
                                className={s.select}
                                style={{ flex: 1, minWidth: "90px" }}
                                disabled={readOnly}
                                value={br.start || "12:00"}
                                onChange={(e) => {
                                  const nb = [...r.breaks];
                                  nb[idx] = { ...nb[idx], start: e.target.value };
                                  setWeekday(wd, { closed: false, open: r.open, close: r.close, breaks: nb });
                                }}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <span>〜</span>
                              <select
                                className={s.select}
                                style={{ flex: 1, minWidth: "90px" }}
                                disabled={readOnly}
                                value={br.end || "13:00"}
                                onChange={(e) => {
                                  const nb = [...r.breaks];
                                  nb[idx] = { ...nb[idx], end: e.target.value };
                                  setWeekday(wd, { closed: false, open: r.open, close: r.close, breaks: nb });
                                }}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              {!readOnly ? (
                                <button
                                  type="button"
                                  className={s.btnDanger}
                                  onClick={() => {
                                    const nb = r.breaks.filter((_, i) => i !== idx);
                                    setWeekday(wd, { closed: false, open: r.open, close: r.close, breaks: nb });
                                  }}
                                >
                                  🗑
                                </button>
                              ) : null}
                            </div>
                          ))}
                          {!readOnly ? (
                            <button
                              type="button"
                              className={s.btnGhost}
                              onClick={() =>
                                setWeekday(wd, {
                                  closed: false,
                                  open: r.open,
                                  close: r.close,
                                  breaks: [...(r.breaks || []), { start: "12:00", end: "13:00" }],
                                })
                              }
                            >
                              ＋ 休憩を追加
                            </button>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {!readOnly ? (
              <div className={s.yearNav}>
                <button type="button" className={s.btnGhost} onClick={() => setYear((y) => y - 1)}>
                  ← 前年
                </button>
                <div className={s.yearTitle}>{year}年</div>
                <button type="button" className={s.btnGhost} onClick={() => setYear((y) => y + 1)}>
                  次年 →
                </button>
              </div>
            ) : null}
            {!readOnly ? (
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                <input type="checkbox" checked={groupMode} onChange={(e) => setGroupMode(e.target.checked)} />
                複数日を選んで一括設定
              </label>
            ) : null}
            {groupMode && selectedDates.size > 0 && !readOnly ? (
              <div className={s.toolbar}>
                <button type="button" className={s.btnGhost} onClick={() => openPanelForDates([...selectedDates])}>
                  選択 {selectedDates.size} 日に適用
                </button>
                <button type="button" className={s.btnGhost} onClick={() => setSelectedDates(new Set())}>
                  選択解除
                </button>
              </div>
            ) : null}
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 0.5rem" }}>
              色: 赤=休業 / 黄=短縮 / 青=特別。クリックで編集。
            </p>
            <div className={s.monthsGrid}>
              {monthNames.map((mn, mi) => {
                const cells = padMonthDays(year, mi);
                return (
                  <div key={mn} className={s.monthBlock}>
                    <div className={s.monthName}>{mn}</div>
                    <div className={s.calGrid}>
                      {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
                        <div key={d} className={s.calDow}>
                          {d}
                        </div>
                      ))}
                      {cells.map((day, i) => {
                        if (!day) return <div key={`e-${i}`} className={`${s.calCell} ${s.calCellMuted}`} />;
                        const ds = ymd(year, mi, day);
                        const ov = overridesByDate.get(ds);
                        const t = ov ? normalizeOverride(ov)?.type : null;
                        const sel = selectedDates.has(ds);
                        return (
                          <button
                            key={ds}
                            type="button"
                            className={`${s.calCell} ${t ? exStyle(t) : ""} ${sel ? s.calCellSelected : ""}`}
                            onClick={() => onCalendarClick(ds)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!readOnly ? (
          <div>
            <button className={s.btnPrimary} type="button" disabled={saving} onClick={onSave}>
              {saving ? "保存中…" : "この内容を保存"}
            </button>
          </div>
        ) : null}
      </div>

      {panel && !readOnly ? (
        <div className={s.panelBackdrop} role="presentation">
          <button
            type="button"
            aria-label="閉じる"
            style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer" }}
            onClick={() => setPanel(null)}
          />
          <div className={s.panelCard}>
            <h3 className={s.panelTitle}>特別日</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{panel.dates.join(", ")}</p>
            <div style={{ marginTop: "0.75rem" }}>
              <span className={s.fieldLabel}>状態</span>
              <select
                className={s.select}
                value={panel.type}
                onChange={(e) => setPanel((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="closed">休業</option>
                <option value="short">短縮営業</option>
                <option value="special">特別営業</option>
              </select>
            </div>
            {panel.type !== "closed" ? (
              <>
                <div style={{ marginTop: "0.5rem" }}>
                  <span className={s.fieldLabel}>開始</span>
                  <select className={s.select} value={panel.open} onChange={(e) => setPanel((p) => ({ ...p, open: e.target.value }))}>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <span className={s.fieldLabel}>終了</span>
                  <select className={s.select} value={panel.close} onChange={(e) => setPanel((p) => ({ ...p, close: e.target.value }))}>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={s.breakBlock}>
                  <p className={s.breakTitle}>休憩</p>
                  {(panel.breaks || []).map((br, idx) => (
                    <div key={idx} className={s.breakRow}>
                      <select
                        className={s.select}
                        style={{ flex: 1 }}
                        value={br.start || "12:00"}
                        onChange={(e) => {
                          const nb = [...panel.breaks];
                          nb[idx] = { ...nb[idx], start: e.target.value };
                          setPanel((p) => ({ ...p, breaks: nb }));
                        }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span>〜</span>
                      <select
                        className={s.select}
                        style={{ flex: 1 }}
                        value={br.end || "13:00"}
                        onChange={(e) => {
                          const nb = [...panel.breaks];
                          nb[idx] = { ...nb[idx], end: e.target.value };
                          setPanel((p) => ({ ...p, breaks: nb }));
                        }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button type="button" className={s.btnDanger} onClick={() => setPanel((p) => ({ ...p, breaks: p.breaks.filter((_, i) => i !== idx) }))}>
                        🗑
                      </button>
                    </div>
                  ))}
                  <button type="button" className={s.btnGhost} onClick={() => setPanel((p) => ({ ...p, breaks: [...(p.breaks || []), { start: "12:00", end: "13:00" }] }))}>
                    ＋ 休憩を追加
                  </button>
                </div>
              </>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className={s.btnPrimary} onClick={savePanel}>
                適用
              </button>
              <button type="button" className={s.btnGhost} onClick={deletePanelDates}>
                この日の例外を削除
              </button>
              <button type="button" className={s.btnGhost} onClick={() => setPanel(null)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

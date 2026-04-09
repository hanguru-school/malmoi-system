"use client";

import { useCallback, useMemo, useState } from "react";
import { getClassroomDaySchedule } from "../../../../lib/reservations/classroomSchedule.js";
import styles from "../../../login/login.module.css";
import {
  TIME_OPTIONS_5,
  WEEKDAY_LABEL_JA,
  WEEKDAY_ORDER_TOKYO,
  getDayRule,
  setDayRule,
} from "../../../../lib/reservations/scheduleVisualShared.js";
import v from "./classroom-operations-visual.module.css";

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

function overrideStyle(type) {
  if (type === "closed") return v.calCellClosed;
  if (type === "short") return v.calCellShort;
  if (type === "special") return v.calCellSpecial;
  return "";
}

export default function ClassroomOperationsVisual({ value, onChange, schoolBasic = {}, saving, onSave }) {
  const co = value || {};
  const defaultOpen = co.defaultOpen || schoolBasic.businessHoursStart || "10:00";
  const defaultClose = co.defaultClose || schoolBasic.businessHoursEnd || "19:00";
  const weekdayHours = co.weekdayHours || {};
  const dateOverrides = Array.isArray(co.dateOverrides) ? co.dateOverrides : [];

  const [subTab, setSubTab] = useState("weekly");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [groupMode, setGroupMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState(() => new Set());
  const [panel, setPanel] = useState(null);

  const overridesByDate = useMemo(() => {
    const m = new Map();
    for (const raw of dateOverrides) {
      const o = normalizeOverride(raw);
      if (o) m.set(o.date, o);
    }
    return m;
  }, [dateOverrides]);

  const updateCo = useCallback(
    (patch) => {
      onChange({ ...co, ...patch });
    },
    [co, onChange]
  );

  const setWeekday = useCallback(
    (wd, rule) => {
      updateCo({ weekdayHours: setDayRule(weekdayHours, wd, rule) });
    },
    [updateCo, weekdayHours]
  );

  const today = todayYmdTokyo();
  const previewStore = useMemo(
    () => ({
      systemSettings: {
        classroomOperations: {
          ...co,
          defaultOpen,
          defaultClose,
          defaultBreaks: co.defaultBreaks || [],
          weekdayHours,
          dateOverrides,
        },
      },
    }),
    [co, defaultOpen, defaultClose, weekdayHours, dateOverrides]
  );

  const todaySched = useMemo(() => getClassroomDaySchedule(previewStore.systemSettings.classroomOperations, today), [previewStore, today]);

  const breakTotalToday = useMemo(() => {
    if (todaySched.closed || !todaySched.breaks?.length) return 0;
    let t = 0;
    for (const b of todaySched.breaks) {
      const [sh, sm] = String(b.start || "00:00").split(":").map(Number);
      const [eh, em] = String(b.end || "00:00").split(":").map(Number);
      t += eh * 60 + em - (sh * 60 + sm);
    }
    return Math.max(0, t);
  }, [todaySched]);

  function copyMondayToWeekdays() {
    const mon = getDayRule(weekdayHours, 1, defaultOpen, defaultClose);
    let next = { ...weekdayHours };
    for (const wd of [2, 3, 4, 5]) {
      next = setDayRule(next, wd, mon);
    }
    updateCo({ weekdayHours: next });
  }

  function applyWeekdaysOn() {
    let next = { ...weekdayHours };
    for (const wd of [1, 2, 3, 4, 5]) {
      const base = getDayRule(next, wd, defaultOpen, defaultClose);
      next = setDayRule(next, wd, { ...base, closed: false });
    }
    updateCo({ weekdayHours: next });
  }

  function weekendOff() {
    let next = { ...weekdayHours };
    for (const wd of [0, 6]) {
      next = setDayRule(next, wd, { closed: true, open: defaultOpen, close: defaultClose, breaks: [] });
    }
    updateCo({ weekdayHours: next });
  }

  function openPanelForDates(dateStrs) {
    const sorted = [...dateStrs].sort();
    const first = sorted[0];
    const existing = first ? overridesByDate.get(first) : null;
    setPanel({
      dates: sorted,
      type: existing?.type === "closed" ? "closed" : existing?.type === "special" ? "special" : existing ? "short" : "closed",
      open: existing?.open || defaultOpen,
      close: existing?.close || defaultClose,
      breaks: Array.isArray(existing?.breaks) ? [...existing.breaks] : [],
      note: existing?.note || "",
    });
  }

  function savePanel() {
    if (!panel) return;
    let next = dateOverrides.filter((x) => {
      const d = normalizeOverride(x);
      return d && !panel.dates.includes(d.date);
    });
    for (const dStr of panel.dates) {
      if (panel.type === "closed") {
        next.push({ date: dStr, type: "closed", closed: true, note: panel.note || undefined });
      } else {
        next.push({
          date: dStr,
          type: panel.type,
          open: panel.open,
          close: panel.close,
          breaks: panel.breaks,
          note: panel.note || undefined,
        });
      }
    }
    updateCo({ dateOverrides: next });
    setPanel(null);
    setSelectedDates(new Set());
  }

  function deletePanelDates() {
    if (!panel) return;
    const next = dateOverrides.filter((x) => {
      const d = normalizeOverride(x);
      return d && !panel.dates.includes(d.date);
    });
    updateCo({ dateOverrides: next });
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
    if (!dateStr) return;
    if (groupMode) {
      togglePick(dateStr);
      return;
    }
    openPanelForDates([dateStr]);
  }

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  return (
    <div className={v.root}>
      <p className={v.hint}>
        優先度: <strong>日付例外</strong> ＞ <strong>曜日別</strong> ＞ <strong>基本開閉</strong>。予約可否計算（教室枠）にそのまま反映されます。
      </p>

      <div className={v.subTabs}>
        <button type="button" className={`${v.subTab} ${subTab === "weekly" ? v.subTabActive : ""}`} onClick={() => setSubTab("weekly")}>
          基本営業・曜日別
        </button>
        <button type="button" className={`${v.subTab} ${subTab === "exceptions" ? v.subTabActive : ""}`} onClick={() => setSubTab("exceptions")}>
          日付例外（カレンダー）
        </button>
      </div>

      <div className={v.layout}>
        <div>
          {subTab === "weekly" ? (
            <>
              <div className={v.copyBar}>
                <button type="button" onClick={copyMondayToWeekdays}>
                  月曜の設定を火〜金にコピー
                </button>
                <button type="button" onClick={applyWeekdaysOn}>
                  平日（月〜金）を営業ON
                </button>
                <button type="button" onClick={weekendOff}>
                  土日を休業にする
                </button>
              </div>
              {WEEKDAY_ORDER_TOKYO.map((wd) => {
                const rule = getDayRule(weekdayHours, wd, defaultOpen, defaultClose);
                return (
                  <div key={wd} className={v.dayCard}>
                    <div className={v.dayHead}>
                      <span className={v.dayLabel}>{WEEKDAY_LABEL_JA[wd]}</span>
                      <button
                        type="button"
                        className={`${v.toggle} ${!rule.closed ? v.toggleOn : ""}`}
                        aria-pressed={!rule.closed}
                        onClick={() =>
                          setWeekday(wd, rule.closed ? { closed: false, open: rule.open, close: rule.close, breaks: rule.breaks } : { closed: true })
                        }
                      >
                        <span className={v.toggleKnob} />
                      </button>
                      <span className={v.hint} style={{ margin: 0 }}>
                        {rule.closed ? "休業" : "営業"}
                      </span>
                    </div>
                    {!rule.closed ? (
                      <>
                        <div className={v.timeRow}>
                          <span className={v.hint} style={{ margin: 0 }}>
                            開始
                          </span>
                          <select
                            className={v.select}
                            value={rule.open}
                            onChange={(e) => setWeekday(wd, { closed: false, open: e.target.value, close: rule.close, breaks: rule.breaks })}
                          >
                            {TIME_OPTIONS_5.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <span className={v.hint} style={{ margin: 0 }}>
                            終了
                          </span>
                          <select
                            className={v.select}
                            value={rule.close}
                            onChange={(e) => setWeekday(wd, { closed: false, open: rule.open, close: e.target.value, breaks: rule.breaks })}
                          >
                            {TIME_OPTIONS_5.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={v.breaksBox}>
                          <div className={v.breaksTitle}>休憩</div>
                          {(rule.breaks || []).map((br, idx) => (
                            <div key={idx} className={v.breakRow}>
                              <select
                                className={v.select}
                                value={br.start || "12:00"}
                                onChange={(e) => {
                                  const nb = [...rule.breaks];
                                  nb[idx] = { ...nb[idx], start: e.target.value };
                                  setWeekday(wd, { closed: false, open: rule.open, close: rule.close, breaks: nb });
                                }}
                              >
                                {TIME_OPTIONS_5.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <span>〜</span>
                              <select
                                className={v.select}
                                value={br.end || "13:00"}
                                onChange={(e) => {
                                  const nb = [...rule.breaks];
                                  nb[idx] = { ...nb[idx], end: e.target.value };
                                  setWeekday(wd, { closed: false, open: rule.open, close: rule.close, breaks: nb });
                                }}
                              >
                                {TIME_OPTIONS_5.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className={v.iconBtn}
                                title="削除"
                                onClick={() => {
                                  const nb = rule.breaks.filter((_, i) => i !== idx);
                                  setWeekday(wd, { closed: false, open: rule.open, close: rule.close, breaks: nb });
                                }}
                              >
                                🗑
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className={v.addBreakBtn}
                            onClick={() =>
                              setWeekday(wd, {
                                closed: false,
                                open: rule.open,
                                close: rule.close,
                                breaks: [...(rule.breaks || []), { start: "12:00", end: "13:00" }],
                              })
                            }
                          >
                            ＋ 休憩を追加
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <div className={v.yearNav}>
                <button type="button" className={v.addBreakBtn} onClick={() => setYear((y) => y - 1)}>
                  ← 前年
                </button>
                <div className={v.yearTitle}>{year}年</div>
                <button type="button" className={v.addBreakBtn} onClick={() => setYear((y) => y + 1)}>
                  次年 →
                </button>
              </div>
              <label className={v.groupToggle}>
                <input type="checkbox" checked={groupMode} onChange={(e) => setGroupMode(e.target.checked)} />
                グループ選択（複数日を選んで一括設定）
              </label>
              {groupMode && selectedDates.size > 0 ? (
                <div className={v.copyBar}>
                  <button type="button" onClick={() => openPanelForDates([...selectedDates])}>
                    選択した {selectedDates.size} 日に同じ設定を適用
                  </button>
                  <button type="button" onClick={() => setSelectedDates(new Set())}>
                    選択解除
                  </button>
                </div>
              ) : null}
              <p className={v.hint}>色: 赤=休業 / 黄=短縮 / 青=特別営業。クリックで編集。グループ選択時はセルをタップしてから一括適用。</p>
              <div className={v.monthsGrid}>
                {monthNames.map((mn, mi) => {
                  const cells = padMonthDays(year, mi);
                  return (
                    <div key={mn} className={v.monthBlock}>
                      <div className={v.monthName}>{mn}</div>
                      <div className={v.calGrid}>
                        {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
                          <div key={d} className={v.calDow}>
                            {d}
                          </div>
                        ))}
                        {cells.map((day, i) => {
                          if (!day) return <div key={`e-${i}`} className={`${v.calCell} ${v.calCellMuted}`} />;
                          const ds = ymd(year, mi, day);
                          const ov = overridesByDate.get(ds);
                          const t = ov ? normalizeOverride(ov)?.type : null;
                          const sel = selectedDates.has(ds);
                          return (
                            <button
                              key={ds}
                              type="button"
                              className={`${v.calCell} ${t ? overrideStyle(t) : ""} ${sel ? v.calCellSelected : ""}`}
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

          <div style={{ marginTop: "1rem" }}>
            <button className={styles.button} type="button" disabled={saving} onClick={onSave}>
              {saving ? "保存中..." : "この内容を保存"}
            </button>
          </div>
        </div>

        <aside className={v.summaryCard}>
          <h4 className={v.summaryTitle}>リアルタイム要約</h4>
          <p className={v.summaryLine}>
            <strong>今日（東京）</strong> {today}
          </p>
          <p className={v.summaryLine}>
            {todaySched.closed ? "本日: 休業" : `本日: 営業（休憩合計 約${breakTotalToday}分）`}
          </p>
          <p className={v.summaryLine}>登録済み日付例外: {dateOverrides.length} 件</p>
          <p className={v.hint} style={{ marginTop: "0.75rem" }}>
            基本の開店・閉店は各曜日カードの値から自動同期されます（保存時に反映）。
          </p>
        </aside>
      </div>

      {panel ? (
        <div className={v.panel} role="presentation">
          <button type="button" aria-label="閉じる" style={{ flex: 1, border: "none", background: "transparent" }} onClick={() => setPanel(null)} />
          <div className={v.panelCard}>
            <h3 className={v.panelTitle}>日付例外</h3>
            <p className={v.hint}>{panel.dates.join(", ")}</p>
            <div className={v.fieldStack}>
              <label>状態</label>
              <select
                className={v.select}
                style={{ width: "100%" }}
                value={panel.type}
                onChange={(e) => setPanel((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="closed">休業日</option>
                <option value="short">短縮営業</option>
                <option value="special">特別営業</option>
              </select>
            </div>
            {panel.type !== "closed" ? (
              <>
                <div className={v.fieldStack}>
                  <label>開始</label>
                  <select className={v.select} value={panel.open} onChange={(e) => setPanel((p) => ({ ...p, open: e.target.value }))}>
                    {TIME_OPTIONS_5.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={v.fieldStack}>
                  <label>終了</label>
                  <select className={v.select} value={panel.close} onChange={(e) => setPanel((p) => ({ ...p, close: e.target.value }))}>
                    {TIME_OPTIONS_5.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={v.breaksBox}>
                  <div className={v.breaksTitle}>休憩（任意）</div>
                  {(panel.breaks || []).map((br, idx) => (
                    <div key={idx} className={v.breakRow}>
                      <select
                        className={v.select}
                        value={br.start || "12:00"}
                        onChange={(e) => {
                          const nb = [...panel.breaks];
                          nb[idx] = { ...nb[idx], start: e.target.value };
                          setPanel((p) => ({ ...p, breaks: nb }));
                        }}
                      >
                        {TIME_OPTIONS_5.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span>〜</span>
                      <select
                        className={v.select}
                        value={br.end || "13:00"}
                        onChange={(e) => {
                          const nb = [...panel.breaks];
                          nb[idx] = { ...nb[idx], end: e.target.value };
                          setPanel((p) => ({ ...p, breaks: nb }));
                        }}
                      >
                        {TIME_OPTIONS_5.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={v.iconBtn}
                        onClick={() => setPanel((p) => ({ ...p, breaks: p.breaks.filter((_, i) => i !== idx) }))}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                  <button type="button" className={v.addBreakBtn} onClick={() => setPanel((p) => ({ ...p, breaks: [...(p.breaks || []), { start: "12:00", end: "13:00" }] }))}>
                    ＋ 休憩を追加
                  </button>
                </div>
              </>
            ) : null}
            <div className={v.fieldStack}>
              <label>メモ</label>
              <textarea className={v.textarea} value={panel.note} onChange={(e) => setPanel((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <div className={v.panelActions}>
              <button type="button" className={v.primaryBtn} onClick={savePanel}>
                保存
              </button>
              <button type="button" className={v.dangerBtn} onClick={deletePanelDates}>
                この日の例外を削除
              </button>
              <button type="button" className={v.addBreakBtn} onClick={() => setPanel(null)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../../../login/login.module.css";
import { TIME_OPTIONS_5, WEEKDAY_LABEL_JA, WEEKDAY_ORDER_TOKYO } from "../../../../lib/reservations/scheduleVisualShared.js";
import tv from "./teacher-availability-visual.module.css";

function padMonth(year, mi) {
  const first = new Date(year, mi, 1);
  const last = new Date(year, mi + 1, 0);
  const dim = last.getDate();
  let s = first.getDay();
  s = (s + 6) % 7;
  const cells = [];
  for (let i = 0; i < s; i += 1) cells.push(null);
  for (let d = 1; d <= dim; d += 1) cells.push(d);
  return cells;
}

function ymd(y, mi, d) {
  return `${y}-${String(mi + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function readWeeklyDay(weekly, wd, fallbackStart = "10:00", fallbackEnd = "19:00") {
  const w = weekly || {};
  const raw = w[String(wd)] ?? w[wd];
  if (!raw) return { on: true, start: fallbackStart, end: fallbackEnd };
  if (raw.closed === true) return { on: false, start: fallbackStart, end: fallbackEnd };
  let intervals = [];
  if (Array.isArray(raw)) intervals = raw;
  else if (raw.intervals) intervals = raw.intervals;
  else if (raw.start && raw.end) intervals = [{ start: raw.start, end: raw.end }];
  if (!intervals.length) return { on: false, start: fallbackStart, end: fallbackEnd };
  const it = intervals[0];
  return {
    on: true,
    start: it.start || it.open || fallbackStart,
    end: it.end || it.close || fallbackEnd,
  };
}

function writeWeeklyDay(weekly, wd, state, fallbackStart, fallbackEnd) {
  const next = { ...(weekly || {}) };
  if (!state.on) {
    next[String(wd)] = { intervals: [] };
  } else {
    next[String(wd)] = {
      intervals: [{ start: state.start || fallbackStart, end: state.end || fallbackEnd }],
    };
  }
  return next;
}

export default function TeacherAvailabilityVisual() {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [weekly, setWeekly] = useState({});
  const [exceptions, setExceptions] = useState([]);
  const [adminLocks, setAdminLocks] = useState([]);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sub, setSub] = useState("weekly");
  const [year, setYear] = useState(() => new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/teacher-availability", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "取得に失敗しました。");
      setProfiles(data.profiles || []);
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = profiles.find((p) => p.teacherUserId === selectedId) || null;

  useEffect(() => {
    if (!selected) {
      setWeekly({});
      setExceptions([]);
      setAdminLocks([]);
      return;
    }
    setWeekly(selected.weekly && typeof selected.weekly === "object" ? { ...selected.weekly } : {});
    setExceptions(Array.isArray(selected.exceptions) ? [...selected.exceptions] : []);
    setAdminLocks(Array.isArray(selected.adminLocks) ? [...selected.adminLocks] : []);
  }, [selected]);

  useEffect(() => {
    if (profiles.length && !selectedId) setSelectedId(profiles[0].teacherUserId);
  }, [profiles, selectedId]);

  const offDates = useMemo(() => {
    const s = new Set();
    for (const ex of exceptions) {
      const d = String(ex?.date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      if (ex.type === "off" || ex.closed === true) s.add(d);
    }
    return s;
  }, [exceptions]);

  function setDay(wd, partial) {
    const cur = readWeeklyDay(weekly, wd);
    setWeekly(writeWeeklyDay(weekly, wd, { ...cur, ...partial }, "10:00", "19:00"));
  }

  function copyMonToThuFri() {
    const mon = readWeeklyDay(weekly, 1);
    let w = { ...weekly };
    for (const wd of [2, 3, 4, 5]) {
      w = writeWeeklyDay(w, wd, mon, "10:00", "19:00");
    }
    setWeekly(w);
  }

  function weekendOff() {
    let w = { ...weekly };
    for (const wd of [0, 6]) {
      w = writeWeeklyDay(w, wd, { on: false, start: "10:00", end: "19:00" }, "10:00", "19:00");
    }
    setWeekly(w);
  }

  function toggleExceptionDate(ds) {
    if (offDates.has(ds)) {
      setExceptions(exceptions.filter((ex) => String(ex.date || "").slice(0, 10) !== ds));
    } else {
      setExceptions([...exceptions, { date: ds, type: "off" }]);
    }
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/teacher-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherUserId: selectedId, weekly, exceptions, adminLocks }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "保存に失敗しました。");
      setStatus({ type: "success", text: "講師の可否時間を保存しました。" });
      await load();
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  return (
    <section style={{ marginTop: "1rem" }}>
      <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>
        講師スケジュール（ビジュアル）
      </h3>
      <p className={tv.hint}>週次の受付枠と「休み」例外をカレンダーで設定します。予約候補計算の講師フィルタに反映されます。</p>
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>{status.text}</p>
      ) : null}
      {loading ? <p className={tv.hint}>読み込み中...</p> : null}

      <div className={tv.root}>
        <div className={tv.teacherList}>
          {profiles.map((p) => (
            <button
              key={p.teacherUserId}
              type="button"
              className={`${tv.teacherBtn} ${selectedId === p.teacherUserId ? tv.teacherBtnActive : ""}`}
              onClick={() => setSelectedId(p.teacherUserId)}
            >
              <div className={tv.teacherName}>{p.displayName || p.email}</div>
              <div className={tv.teacherMail}>{p.email}</div>
            </button>
          ))}
          {!profiles.length && !loading ? <div className={tv.hint} style={{ padding: "1rem" }}>講師ユーザーがありません。</div> : null}
        </div>

        <div className={tv.main}>
          {!selectedId ? null : (
            <>
              <div className={tv.subTabs}>
                <button type="button" className={`${tv.subTab} ${sub === "weekly" ? tv.subTabOn : ""}`} onClick={() => setSub("weekly")}>
                  週次受付
                </button>
                <button type="button" className={`${tv.subTab} ${sub === "exceptions" ? tv.subTabOn : ""}`} onClick={() => setSub("exceptions")}>
                  休み日（例外）
                </button>
                <button type="button" className={`${tv.subTab} ${sub === "locks" ? tv.subTabOn : ""}`} onClick={() => setSub("locks")}>
                  管理者ロック
                </button>
              </div>

              {sub === "weekly" ? (
                <>
                  <div className={tv.copyBar}>
                    <button type="button" className={tv.copyBtn} onClick={copyMonToThuFri}>
                      月→火〜金にコピー
                    </button>
                    <button type="button" className={tv.copyBtn} onClick={weekendOff}>
                      土日を受付OFF
                    </button>
                  </div>
                  {WEEKDAY_ORDER_TOKYO.map((wd) => {
                    const st = readWeeklyDay(weekly, wd);
                    return (
                      <div key={wd} className={tv.dayCard}>
                        <div className={tv.dayHead}>
                          <span className={tv.dayLab}>{WEEKDAY_LABEL_JA[wd]}</span>
                          <button
                            type="button"
                            className={`${tv.toggle} ${st.on ? tv.toggleOn : ""}`}
                            onClick={() => setDay(wd, { on: !st.on })}
                          >
                            <span className={tv.knob} />
                          </button>
                          <span className={tv.hint} style={{ margin: 0 }}>
                            {st.on ? "受付あり" : "受付なし"}
                          </span>
                        </div>
                        {st.on ? (
                          <div className={tv.row}>
                            <select className={tv.select} value={st.start} onChange={(e) => setDay(wd, { start: e.target.value })}>
                              {TIME_OPTIONS_5.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <span>〜</span>
                            <select className={tv.select} value={st.end} onChange={(e) => setDay(wd, { end: e.target.value })}>
                              {TIME_OPTIONS_5.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </>
              ) : null}

              {sub === "exceptions" ? (
                <>
                  <div className={tv.row} style={{ marginBottom: 8 }}>
                    <button type="button" className={tv.copyBtn} onClick={() => setYear((y) => y - 1)}>
                      ← {year - 1}
                    </button>
                    <strong style={{ margin: "0 0.5rem" }}>{year}年</strong>
                    <button type="button" className={tv.copyBtn} onClick={() => setYear((y) => y + 1)}>
                      {year + 1} →
                    </button>
                  </div>
                  <p className={tv.hint}>赤い日は受付外（休み）。タップで切り替え。</p>
                  <div className={tv.calWrap}>
                    {months.map((mn, mi) => (
                      <div key={mn} className={tv.month}>
                        <div className={tv.mTitle}>{mn}</div>
                        <div className={tv.grid}>
                          {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
                            <div key={d} className={tv.dow}>
                              {d}
                            </div>
                          ))}
                          {padMonth(year, mi).map((day, i) =>
                            !day ? (
                              <div key={`e-${i}`} className={`${tv.cell} ${tv.cellMuted}`} />
                            ) : (
                              <button
                                key={ymd(year, mi, day)}
                                type="button"
                                className={`${tv.cell} ${offDates.has(ymd(year, mi, day)) ? tv.cellOff : ""}`}
                                onClick={() => toggleExceptionDate(ymd(year, mi, day))}
                              >
                                {day}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={tv.list}>登録中の休み: {offDates.size} 日</div>
                </>
              ) : null}

              {sub === "locks" ? (
                <>
                  <p className={tv.hint}>特定日時を受付から除外する管理者ロックです（上級者向け）。</p>
                  {adminLocks.map((lk, idx) => (
                    <div key={idx} className={tv.dayCard}>
                      <div className={tv.row}>
                        <input
                          className={tv.select}
                          type="date"
                          value={String(lk.date || "").slice(0, 10)}
                          onChange={(e) => {
                            const n = [...adminLocks];
                            n[idx] = { ...n[idx], date: e.target.value };
                            setAdminLocks(n);
                          }}
                        />
                        <input
                          className={tv.select}
                          type="time"
                          value={lk.start || lk.from || "12:00"}
                          onChange={(e) => {
                            const n = [...adminLocks];
                            n[idx] = { ...n[idx], start: e.target.value };
                            setAdminLocks(n);
                          }}
                        />
                        <span>〜</span>
                        <input
                          className={tv.select}
                          type="time"
                          value={lk.end || lk.to || "13:00"}
                          onChange={(e) => {
                            const n = [...adminLocks];
                            n[idx] = { ...n[idx], end: e.target.value };
                            setAdminLocks(n);
                          }}
                        />
                        <button type="button" className={tv.copyBtn} onClick={() => setAdminLocks(adminLocks.filter((_, i) => i !== idx))}>
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={tv.copyBtn}
                    onClick={() => setAdminLocks([...adminLocks, { date: `${year}-01-01`, start: "12:00", end: "13:00" }])}
                  >
                    ＋ ロックを追加
                  </button>
                </>
              ) : null}

              <div style={{ marginTop: "1rem" }}>
                <button className={styles.button} type="button" disabled={saving || !selectedId} onClick={save}>
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

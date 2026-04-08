"use client";

/**
 * 管理画面 予約運用 V2（カレンダー優先・運用向けツールバー）
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../../../../app/login/login.module.css";
import adminStyles from "../../../../app/admin/admin.module.css";
import panelStyles from "../../../../app/admin/reservations/reservations-panel.module.css";
import v2 from "./admin-reservations-app.module.css";
import {
  addDaysYmd,
  addMonthsYmd,
  buildMonthGridCells,
  computeReservationFetchRange,
  formatYmd,
  listDaysInclusive,
  parseYmd,
  reservationRowToCalendarEvent,
  sortCalendarEventsByStart,
  startOfWeekMondayIso,
} from "../../../../lib/admin/reservationCalendarModel.js";
import {
  fetchAdminReservationsList,
  fetchAdminReservationSlotsRange,
  fetchAdminStudentsPage,
  patchAdminReservationSlot,
} from "../../adapters/adminReservationsAdapter";
import AdminReservationCreateWizard from "./AdminReservationCreateWizard";
import ReservationDetailPanel from "./ReservationDetailPanel";

const EMPTY_RESERVATION_LABEL = "該当日程の予約はありません";

const DEFAULT_TIMELINE_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function todayIso() {
  return formatYmd(new Date());
}

function statusLabel(status) {
  const map = {
    requested: "承認待ち",
    confirmed: "承認済み",
    change_requested: "変更対応中",
    rejected: "却下",
    scheduled: "再調整待ち",
    cancelled: "キャンセル",
    completed: "完了",
  };
  return map[String(status || "").trim()] || String(status || "-");
}

function deliveryLabel(item) {
  return String(item.lessonDeliveryType || "") === "online" ? "オンライン" : "対面";
}

function lessonTypeLabel(item) {
  if (item.lessonGroupType === "pair") return "ペア";
  if (item.slotLessonMode === "group") return "グループ";
  if (item.slotLessonMode === "one_on_one") return "1:1";
  return item.slotLessonMode || "-";
}

function sortableKey(item) {
  return `${item.date || ""} ${item.time || ""}`;
}

export default function AdminReservationsApp({ initialReservations = [], initialFilters = {}, scopeNotice = "" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStudentId = useMemo(() => String(initialFilters.studentId || "").trim(), [initialFilters.studentId]);

  const [calendarDate, setCalendarDate] = useState(
    () => String(initialFilters.anchorDate || initialFilters.fromDate || "").trim() || todayIso()
  );
  const [scheduleView, setScheduleView] = useState("week");
  const [viewMode, setViewMode] = useState("calendar");
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || "");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [lessonFilter, setLessonFilter] = useState(initialFilters.lessonMode || "");
  const [query, setQuery] = useState(initialFilters.q || "");
  const [reservations, setReservations] = useState(initialReservations);
  const [slots, setSlots] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slotBusyId, setSlotBusyId] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [localPrefillStudentId, setLocalPrefillStudentId] = useState("");

  const urlPrefill = String(searchParams.get("prefillStudentId") || "").trim();
  const wizardPrefillId = localPrefillStudentId || urlPrefill || urlStudentId;
  const urlDateParam = searchParams.get("date");
  const urlOpenCreate = searchParams.get("openCreate");

  useEffect(() => {
    const d = String(urlDateParam || "").trim();
    if (d) setCalendarDate(d);
  }, [urlDateParam]);

  useEffect(() => {
    if (urlOpenCreate === "1") setOpenCreate(true);
  }, [urlOpenCreate]);

  const studentsById = useMemo(() => {
    const m = {};
    (students || []).forEach((s) => {
      m[s.id] = s;
    });
    return m;
  }, [students]);

  const filtered = useMemo(() => {
    return [...reservations]
      .filter((item) => (statusFilter ? item.status === statusFilter : true))
      .filter((item) => (teacherFilter ? String(item.instructorUserId || "") === teacherFilter : true))
      .filter((item) => {
        if (!lessonFilter) return true;
        if (lessonFilter === "in_person" || lessonFilter === "online") {
          return String(item.lessonDeliveryType || "in_person") === lessonFilter;
        }
        if (lessonFilter === "pair") return item.lessonGroupType === "pair";
        if (lessonFilter === "group") return item.slotLessonMode === "group" && item.lessonGroupType !== "pair";
        if (lessonFilter === "one_on_one") return item.slotLessonMode === "one_on_one";
        return true;
      })
      .filter((item) => {
        const q = String(query || "").trim().toLowerCase();
        if (!q) return true;
        const hay = [
          item.studentNameKanji,
          item.studentNameFurigana,
          item.studentNumber,
          item.studentEmail,
          item.instructorName,
          item.memo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => sortableKey(a).localeCompare(sortableKey(b)));
  }, [reservations, statusFilter, teacherFilter, lessonFilter, query]);

  const scheduleRange = useMemo(() => {
    if (scheduleView === "month") {
      const base = parseYmd(calendarDate) || parseYmd(todayIso());
      const month = base.getMonth();
      const year = base.getFullYear();
      return {
        label: `${year}年${month + 1}月`,
        includes: (item) => {
          const dt = parseYmd(item.date);
          return dt && dt.getMonth() === month && dt.getFullYear() === year;
        },
      };
    }
    if (scheduleView === "week") {
      const start = startOfWeekMondayIso(calendarDate);
      const end = addDaysYmd(start, 6);
      return {
        label: `${start} – ${end}`,
        includes: (item) => String(item.date || "") >= start && String(item.date || "") <= end,
      };
    }
    return {
      label: calendarDate,
      includes: (item) => String(item.date || "").slice(0, 10) === String(calendarDate || "").slice(0, 10),
    };
  }, [calendarDate, scheduleView]);

  const scheduleItems = useMemo(
    () =>
      filtered
        .filter((item) => scheduleRange.includes(item))
        .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`)),
    [filtered, scheduleRange]
  );

  const calendarEvents = useMemo(
    () => sortCalendarEventsByStart(scheduleItems.map((row) => reservationRowToCalendarEvent(row))),
    [scheduleItems]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map();
    calendarEvents.forEach((ev) => {
      const d = String(ev.date || "").slice(0, 10);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(ev);
    });
    return map;
  }, [calendarEvents]);

  const monthGridCells = useMemo(
    () => (scheduleView === "month" ? buildMonthGridCells(calendarDate) : []),
    [scheduleView, calendarDate]
  );

  const weekDayList = useMemo(() => {
    if (scheduleView !== "week") return [];
    const start = startOfWeekMondayIso(calendarDate);
    return listDaysInclusive(start, addDaysYmd(start, 6));
  }, [scheduleView, calendarDate]);

  const timelineGroups = useMemo(() => {
    const map = new Map();
    scheduleItems.forEach((item) => {
      const key = String(item.time || "-").slice(0, 5);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [scheduleItems]);

  const displayTimelineGroups = useMemo(() => {
    if (timelineGroups.length > 0) return timelineGroups;
    const fromSlots = [
      ...new Set((slots || []).map((s) => String(s.time || "").trim().slice(0, 5)).filter(Boolean)),
    ].sort();
    if (fromSlots.length > 0) {
      return fromSlots.map((t) => [t, []]);
    }
    return DEFAULT_TIMELINE_TIMES.map((t) => [t, []]);
  }, [timelineGroups, slots]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { fromDate, toDate } = computeReservationFetchRange(scheduleView, calendarDate);
      const [rData, sData, stData] = await Promise.all([
        fetchAdminReservationsList({
          fromDate,
          toDate,
          page: 1,
          pageSize: 500,
          ...(urlStudentId ? { studentId: urlStudentId } : {}),
        }),
        fetchAdminReservationSlotsRange(fromDate, toDate),
        fetchAdminStudentsPage(1, 400),
      ]);
      setReservations(rData.reservations || []);
      setSlots(sData.slots || []);
      setTeachers(sData.teachers || []);
      setStudents(stData.students || []);
      setSelected((prev) => {
        if (!prev) return null;
        return (rData.reservations || []).find((x) => x.id === prev.id) || null;
      });
    } catch (e) {
      setError(e.message || "読み込みエラー");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarDate, scheduleView, urlStudentId]);

  async function patchSlot(slotId, body) {
    setSlotBusyId(slotId);
    setError("");
    try {
      await patchAdminReservationSlot(slotId, body);
      await load();
    } catch (e) {
      setError(e.message || "スロット更新エラー");
    } finally {
      setSlotBusyId("");
    }
  }

  function openRow(item) {
    setSelected(item);
    if (typeof window !== "undefined" && window.innerWidth < 960) {
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
  }

  function closeWizard() {
    setOpenCreate(false);
    setLocalPrefillStudentId("");
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    let changed = false;
    if (u.searchParams.has("openCreate")) {
      u.searchParams.delete("openCreate");
      changed = true;
    }
    if (u.searchParams.has("prefillStudentId")) {
      u.searchParams.delete("prefillStudentId");
      changed = true;
    }
    if (changed) {
      const qs = u.searchParams.toString();
      router.replace(qs ? `${u.pathname}?${qs}` : u.pathname, { scroll: false });
    }
  }

  function pickReservationFromEvent(ev) {
    const row = reservations.find((r) => String(r.id) === String(ev.id));
    if (row) {
      setCalendarDate(String(row.date || "").slice(0, 10) || calendarDate);
      openRow(row);
    }
  }

  const { fromDate: rangeFrom, toDate: rangeTo } = computeReservationFetchRange(scheduleView, calendarDate);

  function renderReservationDetail() {
    return (
      <ReservationDetailPanel
        reservation={selected}
        teachers={teachers}
        slots={slots}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        noteMissing={false}
        onUpdated={load}
        onOpenCreateForStudent={() => {
          if (!selected) return;
          setLocalPrefillStudentId(String(selected.studentId || ""));
          setOpenCreate(true);
        }}
      />
    );
  }

  function renderMainSchedule() {
    if (viewMode === "calendar") {
      return (
        <div className={panelStyles.calWrap}>
          {scheduleView === "month" ? (
            <div className={`${panelStyles.calGrid} ${panelStyles.monthGrid}`}>
              {["月", "火", "水", "木", "金", "土", "日"].map((w) => (
                <div key={w} className={panelStyles.monthWeekHead}>
                  {w}
                </div>
              ))}
              {monthGridCells.map((cell) => {
                const dayEvents = eventsByDate.get(cell.ymd) || [];
                const isToday = cell.ymd === todayIso();
                return (
                  <div
                    key={cell.ymd}
                    className={`${panelStyles.monthCell} ${cell.inMonth ? "" : panelStyles.monthCellMuted} ${
                      isToday ? panelStyles.monthCellToday : ""
                    }`}
                  >
                    <div className={panelStyles.monthCellDate}>{cell.ymd.slice(8, 10)}</div>
                    {dayEvents.slice(0, 4).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        className={panelStyles.calEventBtn}
                        onClick={() => pickReservationFromEvent(ev)}
                      >
                        {ev.time || String(ev.startAt || "").slice(11, 16)} {ev.studentName}
                      </button>
                    ))}
                    {dayEvents.length > 4 ? (
                      <span className={adminStyles.smallMuted}>+{dayEvents.length - 4}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          {scheduleView === "week" ? (
            <div className={`${panelStyles.calGrid} ${panelStyles.weekGrid}`}>
              {weekDayList.map((ymd) => {
                const dayEvents = sortCalendarEventsByStart(eventsByDate.get(ymd) || []);
                return (
                  <div key={ymd} className={panelStyles.weekCol}>
                    <div className={panelStyles.weekColHead}>{ymd}</div>
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        className={panelStyles.calEventBtn}
                        onClick={() => pickReservationFromEvent(ev)}
                      >
                        <strong>{String(ev.startAt || "").slice(11, 16)}</strong> {ev.studentName}
                        <span className={adminStyles.smallMuted}> / {ev.lessonName}</span>
                      </button>
                    ))}
                    {dayEvents.length === 0 ? (
                      <div className={panelStyles.weekColEmpty} role="status">
                        「{EMPTY_RESERVATION_LABEL}」
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          {scheduleView === "day" ? (
            <div className={panelStyles.dayCalList}>
              {sortCalendarEventsByStart(eventsByDate.get(String(calendarDate).slice(0, 10)) || []).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  className={panelStyles.dayCalRow}
                  onClick={() => pickReservationFromEvent(ev)}
                >
                  <span className={panelStyles.dayCalTime}>{String(ev.startAt || "").slice(11, 16)}</span>
                  <span>
                    {ev.studentName} · {ev.teacherName} · {ev.lessonName} · {statusLabel(ev.status)}
                  </span>
                </button>
              ))}
              {(eventsByDate.get(String(calendarDate).slice(0, 10)) || []).length === 0 ? (
                <div className={panelStyles.dayCalEmpty} role="status">
                  「{EMPTY_RESERVATION_LABEL}」
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }

    if (viewMode === "list") {
      return (
        <>
          <div className={panelStyles.mobileList}>
            {filtered.map((item) => (
              <article key={`card-${item.id}`} className={panelStyles.mobileListCard}>
                <p className={panelStyles.mobileListHead}>
                  {item.date} {item.time || "-"} / {item.studentNameKanji || "-"}
                </p>
                <p className={adminStyles.smallMuted}>
                  {item.studentNumber || "-"} / {item.instructorName || "-"} / {deliveryLabel(item)} / {lessonTypeLabel(item)}
                </p>
                <p className={adminStyles.smallMuted}>状態: {statusLabel(item.status)}</p>
                <button className={adminStyles.inlineLinkButton} type="button" onClick={() => openRow(item)}>
                  詳細
                </button>
              </article>
            ))}
            {!loading && filtered.length === 0 ? (
              <div className={panelStyles.listEmptyPane} role="status">
                「{EMPTY_RESERVATION_LABEL}」
              </div>
            ) : null}
          </div>
          <div className={`${adminStyles.tableWrap} ${panelStyles.desktopTableWrap}`}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>時間</th>
                  <th>学生名</th>
                  <th>講師</th>
                  <th>形式</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openRow(item)}
                    className={`${panelStyles.rowClickable} ${selected?.id === item.id ? v2.rowHighlight : ""}`}
                  >
                    <td>{item.date}</td>
                    <td>{item.time || "-"}</td>
                    <td>{item.studentNameKanji || "-"}</td>
                    <td>{item.instructorName || "-"}</td>
                    <td>
                      {deliveryLabel(item)} / {lessonTypeLabel(item)}
                    </td>
                    <td>{statusLabel(item.status)}</td>
                    <td>
                      <button
                        type="button"
                        className={adminStyles.inlineLinkButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRow(item);
                        }}
                      >
                        開く
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={panelStyles.tableEmptyCell}>
                      <span className={panelStyles.emptyStateQuote}>「{EMPTY_RESERVATION_LABEL}」</span>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    return (
      <div className={panelStyles.timeline}>
        {displayTimelineGroups.map(([time, items]) => (
          <div key={time} className={panelStyles.timelineRow}>
            <div className={panelStyles.timelineTime}>{time}</div>
            <div className={panelStyles.timelineBlocks}>
              {items.length > 0 ? (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={panelStyles.timelineBlock}
                    onClick={() => openRow(item)}
                  >
                    <strong>{item.studentNameKanji || "-"}</strong>
                    <span>
                      {item.date} {deliveryLabel(item)} / {lessonTypeLabel(item)}
                    </span>
                    <span>
                      {statusLabel(item.status)} / {item.instructorName || "-"}
                    </span>
                  </button>
                ))
              ) : (
                <div className={panelStyles.timelineSlotEmpty} role="status">
                  「{EMPTY_RESERVATION_LABEL}」
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={v2.shell}>
      {scopeNotice ? <p className={styles.description}>{scopeNotice}</p> : null}
      <p className={v2.hint}>
        複雑な一括操作や従来レイアウトは{" "}
        <Link href="/admin/reservations?ui=v1" prefetch={false}>
          従来の予約画面
        </Link>
        をご利用ください。
      </p>

      <div className={v2.scheduleCard}>
        <div className={v2.scheduleHead}>
          <h3 className={v2.scheduleTitle}>予約スケジュール</h3>
          <span className={adminStyles.smallMuted}>
            {scheduleRange.label} · 表示 {scheduleItems.length} 件 / 取得範囲 {rangeFrom}〜{rangeTo} · JST
          </span>
        </div>

        <div className={v2.controlRow1}>
          <label className={v2.compactLabel}>
            基準日
            <input
              className={v2.compactField}
              type="date"
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
            />
          </label>
          <div className={v2.navCluster}>
            <button
              className={v2.toolBtn}
              type="button"
              onClick={() =>
                setCalendarDate(
                  scheduleView === "month"
                    ? addMonthsYmd(calendarDate, -1)
                    : scheduleView === "week"
                      ? addDaysYmd(calendarDate, -7)
                      : addDaysYmd(calendarDate, -1)
                )
              }
            >
              前へ
            </button>
            <button
              className={v2.toolBtn}
              type="button"
              onClick={() =>
                setCalendarDate(
                  scheduleView === "month"
                    ? addMonthsYmd(calendarDate, 1)
                    : scheduleView === "week"
                      ? addDaysYmd(calendarDate, 7)
                      : addDaysYmd(calendarDate, 1)
                )
              }
            >
              次へ
            </button>
            <button className={v2.toolBtn} type="button" onClick={() => setCalendarDate(todayIso())}>
              今日へ戻る
            </button>
          </div>
          <div className={v2.row1Spacer} aria-hidden />
          <button className={v2.primaryAction} type="button" onClick={() => setOpenCreate(true)}>
            予約追加
          </button>
        </div>

        <div className={v2.controlRow2}>
          <div className={panelStyles.segmented}>
            <button
              className={`${panelStyles.segmentButton} ${scheduleView === "day" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setScheduleView("day")}
            >
              日
            </button>
            <button
              className={`${panelStyles.segmentButton} ${scheduleView === "week" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setScheduleView("week")}
            >
              週
            </button>
            <button
              className={`${panelStyles.segmentButton} ${scheduleView === "month" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setScheduleView("month")}
            >
              月
            </button>
          </div>
          <div className={panelStyles.segmented}>
            <button
              className={`${panelStyles.segmentButton} ${viewMode === "list" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setViewMode("list")}
            >
              リスト
            </button>
            <button
              className={`${panelStyles.segmentButton} ${viewMode === "timetable" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setViewMode("timetable")}
            >
              時間表
            </button>
            <button
              className={`${panelStyles.segmentButton} ${viewMode === "calendar" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setViewMode("calendar")}
            >
              カレンダー
            </button>
          </div>
          <button className={v2.toolBtn} type="button" onClick={load} disabled={loading}>
            再読込
          </button>
        </div>

        <div className={v2.filterRow}>
          <label className={v2.compactLabel}>
            状態
            <select className={v2.compactField} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">すべて</option>
              <option value="requested">承認待ち</option>
              <option value="confirmed">承認済み</option>
              <option value="change_requested">変更対応中</option>
              <option value="rejected">却下</option>
              <option value="scheduled">再調整待ち</option>
              <option value="cancelled">キャンセル</option>
              <option value="completed">完了</option>
            </select>
          </label>
          <label className={v2.compactLabel}>
            講師
            <select className={v2.compactField} value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
              <option value="">すべて</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName || t.email}
                </option>
              ))}
            </select>
          </label>
          <label className={v2.compactLabel}>
            レッスン形式
            <select className={v2.compactField} value={lessonFilter} onChange={(e) => setLessonFilter(e.target.value)}>
              <option value="">すべて</option>
              <option value="in_person">対面</option>
              <option value="online">オンライン</option>
              <option value="group">グループ</option>
              <option value="pair">ペア</option>
              <option value="one_on_one">1:1</option>
            </select>
          </label>
          <label className={`${v2.compactLabel} ${v2.filterGrow}`}>
            学生検索
            <input
              className={v2.compactField}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="氏名・フリガナ・学生番号"
            />
          </label>
        </div>
      </div>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {loading ? <p className={styles.description}>読み込み中...</p> : null}

      <div className={v2.mainGridTight}>
        <div className={v2.listCol}>
          {renderMainSchedule()}
        </div>
        <aside className={v2.detailDesktop} aria-label="予約詳細パネル">
          {renderReservationDetail()}
        </aside>
      </div>

      <div className={v2.safeZone}>
        <h3 className={v2.safeZoneTitle}>スロット開閉（取得範囲: {rangeFrom} 〜 {rangeTo}）</h3>
        <p className={styles.description}>
          開閉は予約枠に直接影響します。該当範囲のスロットのみ表示されます。
        </p>
        {slots.length === 0 ? (
          <p className={v2.hint} role="status">
            この範囲のスロットがありません。
          </p>
        ) : null}
        {slots.map((slot) => (
          <div key={slot.id} className={v2.slotRow}>
            <span>
              {slot.time} / {slot.lessonMode || "-"} / 残{slot.availableCount ?? "-"}
            </span>
            <span className={adminStyles.smallMuted}>{slot.status === "open" ? "開" : "閉"}</span>
            <button
              type="button"
              className={adminStyles.chipButton}
              disabled={slotBusyId === slot.id || slot.status !== "open"}
              onClick={() => patchSlot(slot.id, { status: "closed" })}
            >
              閉じる
            </button>
            <button
              type="button"
              className={adminStyles.chipButton}
              disabled={slotBusyId === slot.id || slot.status !== "open"}
              onClick={() => patchSlot(slot.id, { status: "open" })}
            >
              開く
            </button>
          </div>
        ))}
      </div>

      <div className={`${v2.drawer} ${v2.hideDrawerDesktop} ${drawerOpen ? v2.drawerOpen : ""}`}>
        <button
          type="button"
          className={v2.drawerBackdrop}
          aria-label="閉じる"
          onClick={() => setDrawerOpen(false)}
        />
        <aside className={v2.drawerPanel}>
          {selected ? renderReservationDetail() : <p className={adminStyles.smallMuted}>行を選択してください</p>}
        </aside>
      </div>

      <AdminReservationCreateWizard
        open={openCreate}
        onClose={closeWizard}
        fromDate={calendarDate}
        teachers={teachers}
        studentsById={studentsById}
        prefillStudentId={wizardPrefillId}
        onCreated={() => load()}
      />
    </section>
  );
}

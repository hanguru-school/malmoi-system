"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import panelStyles from "./reservations-panel.module.css";

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIso(value) {
  const [y, m, d] = String(value || "").split("-").map((token) => Number(token));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatClock(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "00:00";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toDateTime(date, time) {
  const dt = new Date(`${String(date || "").trim()}T${String(time || "00:00").trim()}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function toCalendarEvent(item) {
  const startAt = toDateTime(item.date, item.time);
  if (!startAt) return null;
  const duration = Math.max(30, Number(item.durationMinutes || 50));
  const endAt = new Date(startAt.getTime() + duration * 60 * 1000);
  const title = item.studentNameKanji || item.studentNameFurigana || item.studentNumber || "예약";
  const status = String(item.status || "").trim();

  const palette =
    status === "requested"
      ? { backgroundColor: "#f59e0b", borderColor: "#d97706", textColor: "#ffffff" }
      : status === "confirmed"
        ? { backgroundColor: "#16a34a", borderColor: "#15803d", textColor: "#ffffff" }
        : status === "cancelled"
          ? { backgroundColor: "#94a3b8", borderColor: "#64748b", textColor: "#ffffff" }
          : status === "rejected"
            ? { backgroundColor: "#ef4444", borderColor: "#dc2626", textColor: "#ffffff" }
            : { backgroundColor: "#3b82f6", borderColor: "#2563eb", textColor: "#ffffff" };

  return {
    id: item.id,
    title,
    start: startAt.toISOString(),
    end: endAt.toISOString(),
    allDay: false,
    ...palette,
    extendedProps: {
      reservation: item,
    },
  };
}

function scheduleViewToCalendarView(scheduleView) {
  if (scheduleView === "month") return "dayGridMonth";
  if (scheduleView === "week") return "timeGridWeek";
  return "timeGridDay";
}

function addDays(iso, amount) {
  const base = parseIso(iso) || parseIso(todayIso());
  base.setDate(base.getDate() + amount);
  return formatIso(base);
}

function addMonths(iso, amount) {
  const base = parseIso(iso) || parseIso(todayIso());
  const day = base.getDate();
  base.setDate(1);
  base.setMonth(base.getMonth() + amount);
  const monthLastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(day, monthLastDay));
  return formatIso(base);
}

function startOfMonthIso(iso) {
  const base = parseIso(iso) || parseIso(todayIso());
  base.setDate(1);
  return formatIso(base);
}

function endOfMonthIso(iso) {
  const base = parseIso(iso) || parseIso(todayIso());
  base.setMonth(base.getMonth() + 1, 0);
  return formatIso(base);
}

function startOfWeekIso(iso) {
  const base = parseIso(iso) || parseIso(todayIso());
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return formatIso(base);
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

function statusGuide(status) {
  const map = {
    requested: "この予約は承認待ちです。内容を確認して承認または却下してください。",
    change_requested: "変更対応中です。必要な内容を確認して承認または調整してください。",
    confirmed: "この予約は確定済みです。必要に応じて変更・キャンセル・完了処理が可能です。",
    completed: "この予約は完了済みです。レッスンノート作成へ進めます。",
    cancelled: "この予約はキャンセル済みです。再承認操作は不要です。",
    rejected: "この予約は却下済みです。必要時のみメモを確認してください。",
  };
  return map[String(status || "").trim()] || "予約内容を確認し、必要な対応を実行してください。";
}

function lessonTypeLabel(item) {
  if (item.lessonGroupType === "pair") return "ペア";
  if (item.slotLessonMode === "group") return "グループ";
  if (item.slotLessonMode === "one_on_one") return "1:1";
  return item.slotLessonMode || "-";
}

function deliveryLabel(value) {
  return String(value || "") === "online" ? "オンライン" : "対面";
}

function deliveryShort(value) {
  return String(value || "") === "online" ? "ON" : "対面";
}

function sortableKey(item) {
  return `${item.date || ""} ${item.time || ""}`;
}

function toMinutes(date, time) {
  const dt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.getHours() * 60 + dt.getMinutes();
}

function noteExistsByUnit(notes, unitId) {
  if (!unitId) return false;
  return notes.some((note) => String(note.lessonUnitId || "") === String(unitId));
}

function statusTone(status) {
  const key = String(status || "").trim();
  if (key === "confirmed" || key === "completed") return "good";
  if (key === "requested" || key === "change_requested" || key === "scheduled") return "warn";
  if (key === "cancelled" || key === "rejected") return "bad";
  return "normal";
}

export default function AdminReservationsPanel({
  initialReservations,
  initialFilters = {},
  initialFocus = "",
  scopeNotice = "",
}) {
  const calendarRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(initialFilters.fromDate || todayIso());
  /** メイン表示: カレンダー / リスト / 時間表 */
  const [surfaceView, setSurfaceView] = useState("calendar");
  const [scheduleView, setScheduleView] = useState("day");
  const [scheduleDate, setScheduleDate] = useState(initialFilters.fromDate || todayIso());
  const [calendarTitle, setCalendarTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || "");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [lessonFilter, setLessonFilter] = useState(initialFilters.lessonMode || "");
  const [query, setQuery] = useState(initialFilters.q || "");
  const [reservations, setReservations] = useState(initialReservations || []);
  const [slots, setSlots] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [recentReservationLogs, setRecentReservationLogs] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [overflowDate, setOverflowDate] = useState("");
  const [createForm, setCreateForm] = useState({
    mode: "single",
    slotId: "",
    studentId: "",
    studentAId: "",
    studentBId: "",
    lessonDeliveryType: "in_person",
    memo: "",
  });
  const [editForm, setEditForm] = useState({
    id: "",
    slotId: "",
    status: "",
    lessonDeliveryType: "in_person",
    memo: "",
  });
  const [cancelForm, setCancelForm] = useState({
    notifyStudent: true,
    reason: "",
  });

  function moveSchedule(direction) {
    const api = calendarRef.current?.getApi?.();
    if (api) {
      if (direction < 0) api.prev();
      else api.next();
      return;
    }
    if (scheduleView === "month") {
      setScheduleDate(addMonths(scheduleDate, direction));
      return;
    }
    if (scheduleView === "week") {
      setScheduleDate(addDays(scheduleDate, 7 * direction));
      return;
    }
    setScheduleDate(addDays(scheduleDate, direction));
  }

  const syncFromCalendar = useCallback(() => {
    const api = calendarRef.current?.getApi?.();
    if (!api) return;
    const currentView = api.view?.type || "";
    if (currentView === "dayGridMonth" && scheduleView !== "month") setScheduleView("month");
    if (currentView === "timeGridWeek" && scheduleView !== "week") setScheduleView("week");
    if (currentView === "timeGridDay" && scheduleView !== "day") setScheduleView("day");
    setCalendarTitle(api.view?.title || "");
    const currentDate = formatIso(api.getDate());
    if (currentDate && currentDate !== scheduleDate) {
      setScheduleDate(currentDate);
      setSelectedDate(currentDate);
    }
  }, [scheduleDate, scheduleView]);

  async function handleEventMoveOrResize(changeInfo) {
    const event = changeInfo?.event;
    const startAt = event?.start || null;
    if (!event?.id || !startAt) {
      changeInfo?.revert?.();
      return;
    }
    const endAt = event.end || new Date(startAt.getTime() + 50 * 60 * 1000);
    const durationMinutes = Math.max(30, Math.round((endAt.getTime() - startAt.getTime()) / 60000));
    const ok = await updateReservation(String(event.id), {
      date: formatIso(startAt),
      time: formatClock(startAt),
      durationMinutes,
    });
    if (!ok) {
      changeInfo?.revert?.();
    }
  }

  const filteredReservations = useMemo(() => {
    return [...reservations]
      .filter((item) => (statusFilter ? item.status === statusFilter : true))
      .filter((item) => (teacherFilter ? String(item.instructorUserId || "") === teacherFilter : true))
      .filter((item) => {
        if (!lessonFilter) return true;
        if (lessonFilter === "in_person" || lessonFilter === "online") {
          return item.lessonDeliveryType === lessonFilter;
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
          item.studentId,
          item.lessonUnitId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => sortableKey(a).localeCompare(sortableKey(b)));
  }, [reservations, statusFilter, teacherFilter, lessonFilter, query]);

  const calendarEvents = useMemo(
    () => filteredReservations.map((item) => toCalendarEvent(item)).filter(Boolean),
    [filteredReservations]
  );

  const nowMinute = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const soonReservations = useMemo(
    () =>
      filteredReservations.filter((item) => {
        const minutes = toMinutes(item.date, item.time);
        if (minutes === null) return false;
        return minutes >= nowMinute && minutes <= nowMinute + 90;
      }),
    [filteredReservations, nowMinute]
  );

  const pendingReservations = useMemo(
    () => filteredReservations.filter((item) => ["requested", "change_requested", "scheduled"].includes(item.status)),
    [filteredReservations]
  );

  const sortedPendingForStrip = useMemo(
    () => [...pendingReservations].sort((a, b) => sortableKey(a).localeCompare(sortableKey(b))),
    [pendingReservations]
  );

  const timelineGroups = useMemo(() => {
    const map = new Map();
    filteredReservations.forEach((item) => {
      const key = item.time || "-";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [filteredReservations]);

  const scheduleRange = useMemo(() => {
    if (scheduleView === "month") {
      const base = parseIso(scheduleDate) || parseIso(todayIso());
      const month = base.getMonth();
      const year = base.getFullYear();
      return {
        label: `${year}年${month + 1}月`,
        includes: (item) => {
          const dt = parseIso(item.date);
          return dt && dt.getMonth() === month && dt.getFullYear() === year;
        },
      };
    }
    if (scheduleView === "week") {
      const start = startOfWeekIso(scheduleDate);
      const end = addDays(start, 6);
      return {
        label: `${start} - ${end}`,
        includes: (item) => String(item.date || "") >= start && String(item.date || "") <= end,
      };
    }
    return {
      label: scheduleDate,
      includes: (item) => String(item.date || "") === scheduleDate,
    };
  }, [scheduleDate, scheduleView]);

  const queryRange = useMemo(() => {
    if (scheduleView === "month") {
      return { fromDate: startOfMonthIso(scheduleDate), toDate: endOfMonthIso(scheduleDate) };
    }
    if (scheduleView === "week") {
      const fromDate = startOfWeekIso(scheduleDate);
      return { fromDate, toDate: addDays(fromDate, 6) };
    }
    return { fromDate: scheduleDate, toDate: scheduleDate };
  }, [scheduleDate, scheduleView]);

  const scheduleItems = useMemo(
    () =>
      filteredReservations
        .filter((item) => scheduleRange.includes(item))
        .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`)),
    [filteredReservations, scheduleRange]
  );

  const calendarWeeks = useMemo(() => {
    if (scheduleView !== "month") return [];
    const firstDay = parseIso(startOfMonthIso(scheduleDate));
    if (!firstDay) return [];
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startOffset);
    const weeks = [];
    for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
      const row = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const cell = new Date(gridStart);
        cell.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
        const dateKey = formatIso(cell);
        const items = scheduleItems
          .filter((item) => String(item.date || "") === dateKey)
          .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
        row.push({
          dateKey,
          dayNumber: cell.getDate(),
          inMonth: cell.getMonth() === firstDay.getMonth(),
          items,
        });
      }
      weeks.push(row);
    }
    return weeks;
  }, [scheduleDate, scheduleItems, scheduleView]);

  const weeklyGroups = useMemo(() => {
    if (scheduleView !== "week") return [];
    const fromDate = startOfWeekIso(scheduleDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(fromDate, index);
      return {
        date,
        items: scheduleItems
          .filter((item) => String(item.date || "") === date)
          .sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))),
      };
    });
  }, [scheduleDate, scheduleItems, scheduleView]);

  const dayItems = useMemo(
    () =>
      scheduleItems
        .filter((item) => String(item.date || "") === scheduleDate)
        .sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))),
    [scheduleDate, scheduleItems]
  );

  const pendingCountByDate = useMemo(() => {
    const map = new Map();
    scheduleItems.forEach((item) => {
      if (item.status !== "requested") return;
      const key = String(item.date || "");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [scheduleItems]);

  const slotOptions = useMemo(
    () =>
      slots
        .filter((slot) => slot.status === "open")
        .sort((a, b) => `${a.time || ""}`.localeCompare(`${b.time || ""}`)),
    [slots]
  );

  async function load() {
    setLoading(true);
    setLogsLoading(true);
    setError("");
    try {
      const reservationParams = new URLSearchParams();
      reservationParams.set("fromDate", queryRange.fromDate);
      reservationParams.set("toDate", queryRange.toDate);
      reservationParams.set("page", "1");
      reservationParams.set("pageSize", "300");

      const slotsParams = new URLSearchParams();
      slotsParams.set("fromDate", queryRange.fromDate);
      slotsParams.set("toDate", queryRange.toDate);

      const logsParams = new URLSearchParams();
      logsParams.set("targetType", "reservation");
      logsParams.set("fromDate", queryRange.fromDate);
      logsParams.set("toDate", queryRange.toDate);
      logsParams.set("page", "1");
      logsParams.set("pageSize", "40");

      const [reservationRes, slotsRes, studentRes, notesRes, logsRes] = await Promise.all([
        fetch(`/api/admin/reservations?${reservationParams.toString()}`, { cache: "no-store" }),
        fetch(`/api/admin/reservation-slots?${slotsParams.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/students?page=1&pageSize=300", { cache: "no-store" }),
        fetch("/api/admin/lesson-notes", { cache: "no-store" }),
        fetch(`/api/admin/audit-logs?${logsParams.toString()}`, { cache: "no-store" }),
      ]);
      const reservationData = await reservationRes.json();
      const slotsData = await slotsRes.json();
      const studentData = await studentRes.json();
      const notesData = await notesRes.json();
      const logsData = await logsRes.json();
      if (!reservationRes.ok || !reservationData?.ok) {
        throw new Error(reservationData?.error || "予約一覧の取得に失敗しました。");
      }
      if (!slotsRes.ok || !slotsData?.ok) {
        throw new Error(slotsData?.error || "スロット情報の取得に失敗しました。");
      }
      if (!studentRes.ok || !studentData?.ok) {
        throw new Error(studentData?.error || "学生一覧の取得に失敗しました。");
      }
      setReservations(reservationData.reservations || []);
      setSlots(slotsData.slots || []);
      setTeachers(slotsData.teachers || []);
      setStudents(studentData.students || []);
      setNotes(Array.isArray(notesData?.notes) ? notesData.notes : []);
      setRecentReservationLogs(Array.isArray(logsData?.logs) ? logsData.logs : []);
      setSelectedReservation((prev) => {
        if (!prev) return null;
        return (reservationData.reservations || []).find((item) => item.id === prev.id) || null;
      });
    } catch (err) {
      setError(err.message || "予約管理データ取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryRange.fromDate, queryRange.toDate]);

  useEffect(() => {
    setScheduleDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const api = calendarRef.current?.getApi?.();
    if (!api) return;
    const targetView = scheduleViewToCalendarView(scheduleView);
    if (api.view?.type !== targetView) {
      api.changeView(targetView);
    }
    const current = formatIso(api.getDate());
    if (scheduleDate && current !== scheduleDate) {
      api.gotoDate(scheduleDate);
    }
    syncFromCalendar();
  }, [scheduleDate, scheduleView, syncFromCalendar]);

  useEffect(() => {
    if (!initialFocus) return;
    if (initialFocus === "pending") {
      setStatusFilter("requested");
      setPendingOnly(true);
      return;
    }
    if (initialFocus === "soon") {
      setStatusFilter("");
      return;
    }
  }, [initialFocus]);

  async function updateReservation(id, patch) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "予約更新に失敗しました。");
      }
      await load();
      return true;
    } catch (err) {
      setError(err.message || "予約更新中にエラーが発生しました。");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function createReservation() {
    setSaving(true);
    setError("");
    try {
      const payload =
        createForm.mode === "pair"
          ? {
              mode: "pair",
              slotId: createForm.slotId,
              studentAId: createForm.studentAId,
              studentBId: createForm.studentBId,
              lessonDeliveryType: createForm.lessonDeliveryType,
              memo: createForm.memo,
            }
          : {
              mode: "single",
              slotId: createForm.slotId,
              studentId: createForm.studentId,
              lessonDeliveryType: createForm.lessonDeliveryType,
              memo: createForm.memo,
            };
      const response = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "予約追加に失敗しました。");
      }
      setOpenCreate(false);
      setCreateForm({
        mode: "single",
        slotId: "",
        studentId: "",
        studentAId: "",
        studentBId: "",
        lessonDeliveryType: "in_person",
        memo: "",
      });
      await load();
    } catch (err) {
      setError(err.message || "予約追加中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  function openEditPanel(item) {
    setSelectedReservation(item);
    setEditForm({
      id: item.id,
      slotId: item.slotId || "",
      status: item.status || "requested",
      lessonDeliveryType: item.lessonDeliveryType || "in_person",
      memo: item.memo || "",
    });
    setOpenEdit(true);
  }

  function openCancelPanel(item) {
    setSelectedReservation(item);
    setCancelForm({ notifyStudent: true, reason: "" });
    setOpenCancel(true);
  }

  const selectedNoteExists = selectedReservation
    ? noteExistsByUnit(notes, selectedReservation.lessonUnitId)
    : false;

  return (
    <section className={panelStyles.root}>
      {scopeNotice ? <p className={styles.description}>{scopeNotice}</p> : null}

      <div className={panelStyles.pendingTopStrip}>
        <div className={panelStyles.pendingTopStripHead}>
          <h4 className={panelStyles.pendingTopStripTitle}>承認待ち・対応が必要な予約</h4>
          <div className={panelStyles.pendingTopStripMeta}>
            <span className={adminStyles.smallMuted}>{sortedPendingForStrip.length}件</span>
            <button
              type="button"
              className={adminStyles.inlineLinkButton}
              onClick={() => {
                setStatusFilter("requested");
                setSurfaceView("list");
              }}
            >
              承認待ちで絞り込み
            </button>
          </div>
        </div>
        <div className={panelStyles.pendingTopStripScroll}>
          {sortedPendingForStrip.slice(0, 16).map((item) => (
            <article key={`pending-strip-${item.id}`} className={panelStyles.pendingStripCard}>
              <p className={panelStyles.pendingStripCardTitle}>
                {item.date} {item.time || "--:--"} · {item.studentNameKanji || "-"}
              </p>
              <p className={panelStyles.pendingStripCardSub}>
                {statusLabel(item.status)} / {item.instructorName || "講師未定"} / {deliveryShort(item.lessonDeliveryType)}
              </p>
              <div className={panelStyles.pendingStripCardActions}>
                {item.status === "requested" ? (
                  <>
                    <button
                      type="button"
                      className={panelStyles.pendingStripApprove}
                      onClick={() => updateReservation(item.id, { status: "confirmed" })}
                      disabled={saving}
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      className={panelStyles.pendingStripSub}
                      onClick={() => updateReservation(item.id, { status: "rejected" })}
                      disabled={saving}
                    >
                      却下
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className={panelStyles.pendingStripSub}
                  onClick={() => {
                    setSelectedReservation(item);
                    setSurfaceView("list");
                  }}
                  disabled={saving}
                >
                  詳細
                </button>
              </div>
            </article>
          ))}
        </div>
        {sortedPendingForStrip.length === 0 ? (
          <p className={panelStyles.pendingTopStripEmpty}>現在、対応が必要な予約はありません。</p>
        ) : null}
      </div>

      <div className={panelStyles.schedulePanel}>
        <div className={panelStyles.scheduleHeader}>
          <h3 className={panelStyles.detailTitle}>予約スケジュール</h3>
          <span className={adminStyles.smallMuted}>{calendarTitle || scheduleRange.label}</span>
        </div>
        <div className={panelStyles.scheduleToolbar}>
          <div className={panelStyles.segmented}>
            <button
              className={`${panelStyles.segmentButton} ${surfaceView === "calendar" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setSurfaceView("calendar")}
            >
              カレンダー
            </button>
            <button
              className={`${panelStyles.segmentButton} ${surfaceView === "list" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setSurfaceView("list")}
            >
              リスト
            </button>
            <button
              className={`${panelStyles.segmentButton} ${surfaceView === "timetable" ? panelStyles.segmentButtonActive : ""}`}
              type="button"
              onClick={() => setSurfaceView("timetable")}
            >
              時間表
            </button>
          </div>
          <button className={adminStyles.chipButton} type="button" onClick={() => moveSchedule(-1)}>
            前へ
          </button>
          <button className={adminStyles.chipButton} type="button" onClick={() => moveSchedule(1)}>
            次へ
          </button>
          <button
            className={adminStyles.chipButton}
            type="button"
            onClick={() => {
              const today = todayIso();
              setScheduleDate(today);
              setSelectedDate(today);
              const api = calendarRef.current?.getApi?.();
              if (api) api.today();
            }}
          >
            今日へ戻る
          </button>
          {surfaceView === "calendar" ? (
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
          ) : null}
          <button
            className={`${styles.button} ${panelStyles.primaryAddBtn}`}
            type="button"
            onClick={() => setOpenCreate(true)}
          >
            予約追加
          </button>
        </div>
        <div className={panelStyles.statusLegend}>
          <span className={`${panelStyles.legendItem} ${panelStyles.legendGood}`}>承認済み</span>
          <span className={`${panelStyles.legendItem} ${panelStyles.legendWarn}`}>承認待ち/変更対応中</span>
          <span className={`${panelStyles.legendItem} ${panelStyles.legendBad}`}>却下/キャンセル</span>
          <span className={`${panelStyles.legendItem} ${panelStyles.legendNormal}`}>一般</span>
        </div>
      </div>

      <div className={panelStyles.topControls}>
        <label className={styles.label}>
          状態
          <select className={styles.field} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
        <label className={styles.label}>
          講師
          <select className={styles.field} value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
            <option value="">すべて</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.displayName || teacher.email}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          形式
          <select className={styles.field} value={lessonFilter} onChange={(e) => setLessonFilter(e.target.value)}>
            <option value="">すべて</option>
            <option value="in_person">対面</option>
            <option value="online">オンライン</option>
            <option value="group">グループ</option>
            <option value="pair">ペア</option>
            <option value="one_on_one">1:1</option>
          </select>
        </label>
        <label className={styles.label}>
          検索
          <input
            className={styles.field}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="学生名 / フリガナ / 学生番号 / 講師名"
          />
        </label>
      </div>

      <div className={panelStyles.summaryRow}>
        <article className={panelStyles.summaryCard}>
          <h3>今日の予約</h3>
          <p>{filteredReservations.length}件</p>
        </article>
        <article className={panelStyles.summaryCard}>
          <h3>まもなく開始</h3>
          <p>{soonReservations.length}件</p>
        </article>
        <article className={panelStyles.summaryCard}>
          <h3>状態確認必要</h3>
          <p>{pendingReservations.length}件</p>
          <button className={adminStyles.inlineLinkButton} type="button" onClick={() => setStatusFilter("requested")}>
            未対応のみ表示
          </button>
        </article>
        <article className={panelStyles.summaryCard}>
          <h3>ノート未作成(完了)</h3>
          <p>
            {
              filteredReservations.filter(
                (item) => item.status === "completed" && !noteExistsByUnit(notes, item.lessonUnitId)
              ).length
            }
            件
          </p>
          <button className={adminStyles.inlineLinkButton} type="button" onClick={() => setStatusFilter("completed")}>
            完了のみ表示
          </button>
        </article>
      </div>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {loading ? <p className={styles.description}>読み込み中...</p> : null}

      <div className={panelStyles.bodyGrid}>
        <section className={panelStyles.mainPanel}>
          {surfaceView === "calendar" ? (
            <div className={panelStyles.calendarSurface}>
              <div className={panelStyles.calendarHeaderNote}>
                <span>{calendarTitle || scheduleRange.label}</span>
                <span className={adminStyles.smallMuted}>ドラッグで移動・リサイズで時間調整</span>
              </div>
              <div className={panelStyles.fullCalendarWrap}>
                <FullCalendar
                  key={`${scheduleView}-${scheduleDate}`}
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={scheduleViewToCalendarView(scheduleView)}
                  initialDate={scheduleDate}
                  events={calendarEvents}
                  editable
                  eventDurationEditable
                  eventResizableFromStart
                  selectable={false}
                  dayMaxEventRows={3}
                  height="auto"
                  slotMinTime="08:00:00"
                  slotMaxTime="22:00:00"
                  nowIndicator
                  allDaySlot={false}
                  locale="ja"
                  headerToolbar={false}
                  eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                  eventClick={(clickInfo) => {
                    const target = clickInfo.event.extendedProps?.reservation || null;
                    if (target) setSelectedReservation(target);
                  }}
                  eventDrop={handleEventMoveOrResize}
                  eventResize={handleEventMoveOrResize}
                  datesSet={() => {
                    syncFromCalendar();
                  }}
                />
              </div>
              {(pendingCountByDate.get(scheduleDate) || 0) > 0 ? (
                <p className={panelStyles.dayPendingSummary}>
                  この日の承認待ち <strong>{pendingCountByDate.get(scheduleDate)}件</strong>
                </p>
              ) : null}
            </div>
          ) : surfaceView === "list" ? (
            <>
              <div className={panelStyles.mobileList}>
                {filteredReservations.map((item) => (
                  <article
                    key={`card-${item.id}`}
                    className={`${panelStyles.mobileListCard} ${
                      selectedReservation?.id === item.id ? panelStyles.mobileListCardActive : ""
                    }`}
                  >
                    <p className={panelStyles.mobileListHead}>
                      {item.time || "-"} / {item.studentNameKanji || "-"}
                    </p>
                    <p className={adminStyles.smallMuted}>
                      {item.studentNumber || "-"} / {item.instructorName || "-"} / {deliveryLabel(item.lessonDeliveryType)} /{" "}
                      {lessonTypeLabel(item)}
                    </p>
                    <p className={adminStyles.smallMuted}>状態: {statusLabel(item.status)}</p>
                    <div className={adminStyles.inlineLinks}>
                      {item.status === "requested" ? (
                        <div className={panelStyles.inlineQuickActions}>
                          <button
                            className={panelStyles.inlineQuickApprove}
                            type="button"
                            onClick={() => updateReservation(item.id, { status: "confirmed" })}
                            disabled={saving}
                          >
                            承認
                          </button>
                          <button
                            className={panelStyles.inlineQuickSub}
                            type="button"
                            onClick={() => updateReservation(item.id, { status: "rejected" })}
                            disabled={saving}
                          >
                            却下
                          </button>
                          <button
                            className={panelStyles.inlineQuickSub}
                            type="button"
                            onClick={() => updateReservation(item.id, { status: "change_requested" })}
                            disabled={saving}
                          >
                            変更依頼
                          </button>
                        </div>
                      ) : null}
                      <button className={adminStyles.inlineLinkButton} type="button" onClick={() => setSelectedReservation(item)}>
                        詳細
                      </button>
                      <button className={adminStyles.inlineLinkButton} type="button" onClick={() => openEditPanel(item)}>
                        変更
                      </button>
                      <button className={adminStyles.inlineLinkButton} type="button" onClick={() => openCancelPanel(item)}>
                        キャンセル
                      </button>
                    </div>
                  </article>
                ))}
                {filteredReservations.length === 0 ? <p>該当予約がありません。</p> : null}
              </div>
              <div className={`${adminStyles.tableWrap} ${panelStyles.desktopTableWrap}`}>
                <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>時間</th>
                    <th>学生名</th>
                    <th>学生番号</th>
                    <th>講師名</th>
                    <th>レッスン形式</th>
                    <th>状態</th>
                    <th>メモ</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedReservation(item)}
                      className={`${panelStyles.rowClickable} ${
                        selectedReservation?.id === item.id ? panelStyles.rowSelected : ""
                      }`}
                    >
                      <td>{item.time || "-"}</td>
                      <td>{item.studentNameKanji || "-"}</td>
                      <td>{item.studentNumber || "-"}</td>
                      <td>{item.instructorName || "-"}</td>
                      <td>{deliveryLabel(item.lessonDeliveryType)} / {lessonTypeLabel(item)}</td>
                      <td>
                        <span
                          className={`${adminStyles.statusPill} ${panelStyles.statusBadge} ${
                            item.status === "requested" ? panelStyles.pendingBadge : ""
                          }`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td>{item.memo ? "あり" : "-"}</td>
                      <td>
                        <div className={adminStyles.inlineLinks}>
                          {item.status === "requested" ? (
                            <div className={panelStyles.inlineQuickActions}>
                              <button
                                className={panelStyles.inlineQuickApprove}
                                type="button"
                                onClick={() => updateReservation(item.id, { status: "confirmed" })}
                                disabled={saving}
                              >
                                承認
                              </button>
                              <button
                                className={panelStyles.inlineQuickSub}
                                type="button"
                                onClick={() => updateReservation(item.id, { status: "rejected" })}
                                disabled={saving}
                              >
                                却下
                              </button>
                              <button
                                className={panelStyles.inlineQuickSub}
                                type="button"
                                onClick={() => updateReservation(item.id, { status: "change_requested" })}
                                disabled={saving}
                              >
                                変更依頼
                              </button>
                            </div>
                          ) : null}
                          <button className={adminStyles.inlineLinkButton} type="button" onClick={() => setSelectedReservation(item)}>
                            詳細
                          </button>
                          <button className={adminStyles.inlineLinkButton} type="button" onClick={() => openEditPanel(item)}>
                            変更
                          </button>
                          <button className={adminStyles.inlineLinkButton} type="button" onClick={() => openCancelPanel(item)}>
                            キャンセル
                          </button>
                          <a className={adminStyles.inlineLink} href={`/admin/students/${item.studentId}`}>
                            学生詳細
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={8}>該当予約がありません。</td>
                    </tr>
                  ) : null}
                </tbody>
                </table>
              </div>
            </>
          ) : surfaceView === "timetable" ? (
            <div className={panelStyles.timeline}>
              {timelineGroups.map(([time, items]) => (
                <div key={time} className={panelStyles.timelineRow}>
                  <div className={panelStyles.timelineTime}>{time}</div>
                  <div className={panelStyles.timelineBlocks}>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={panelStyles.timelineBlock}
                        onClick={() => setSelectedReservation(item)}
                      >
                        <strong>{item.studentNameKanji || "-"}</strong>
                        <span>{deliveryLabel(item.lessonDeliveryType)} / {lessonTypeLabel(item)}</span>
                        <span>{statusLabel(item.status)} / {item.instructorName || "-"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {timelineGroups.length === 0 ? <p>該当予約がありません。</p> : null}
            </div>
          ) : null}
        </section>

        <aside className={panelStyles.detailPanel}>
          <h3 className={panelStyles.detailTitle}>予約詳細</h3>
          {!selectedReservation ? (
            <p className={adminStyles.smallMuted}>予約を選択してください。</p>
          ) : (
            <>
              <div className={panelStyles.statusGuide}>
                <p className={panelStyles.statusGuideHead}>状態: {statusLabel(selectedReservation.status)}</p>
                <p>{statusGuide(selectedReservation.status)}</p>
              </div>
              <div className={panelStyles.detailSummary}>
                <p><strong>学生名:</strong> {selectedReservation.studentNameKanji || "-"}</p>
                <p><strong>予約日時:</strong> {selectedReservation.date} {selectedReservation.time}</p>
                <p><strong>状態:</strong> {statusLabel(selectedReservation.status)}</p>
                <p><strong>レッスン形式:</strong> {deliveryLabel(selectedReservation.lessonDeliveryType)} / {lessonTypeLabel(selectedReservation)}</p>
                <p><strong>講師名:</strong> {selectedReservation.instructorName || "-"}</p>
              </div>
              <div className={panelStyles.detailList}>
                <p><strong>学生番号:</strong> {selectedReservation.studentNumber || "-"}</p>
                <p><strong>学生ID:</strong> {selectedReservation.studentId || "-"}</p>
                <p><strong>所要時間:</strong> {selectedReservation.durationMinutes || "-"}分</p>
                <p><strong>作成日:</strong> {selectedReservation.createdAt || "-"}</p>
                <p><strong>更新日:</strong> {selectedReservation.updatedAt || "-"}</p>
                <p><strong>管理メモ:</strong> {selectedReservation.memo || "-"}</p>
                <p><strong>関連レッスンノート:</strong> {selectedNoteExists ? "作成済み" : "未作成"}</p>
              </div>
              <div className={panelStyles.detailActions}>
                {(selectedReservation.status === "requested" || selectedReservation.status === "change_requested") ? (
                  <div className={panelStyles.primaryActionGroup}>
                    <button
                      className={panelStyles.primaryApproveButton}
                      type="button"
                      onClick={() => updateReservation(selectedReservation.id, { status: "confirmed" })}
                      disabled={saving}
                    >
                      承認
                    </button>
                    <button
                      className={panelStyles.primarySubButton}
                      type="button"
                      onClick={() => updateReservation(selectedReservation.id, { status: "rejected" })}
                      disabled={saving}
                    >
                      却下
                    </button>
                    <button
                      className={panelStyles.primarySubButton}
                      type="button"
                      onClick={() => updateReservation(selectedReservation.id, { status: "change_requested" })}
                      disabled={saving}
                    >
                      変更依頼
                    </button>
                  </div>
                ) : null}
                <div className={panelStyles.secondaryActionGroup}>
                  {selectedReservation.status !== "cancelled" ? (
                    <button className={adminStyles.chipButton} type="button" onClick={() => openEditPanel(selectedReservation)}>
                      予約を変更
                    </button>
                  ) : null}
                  {(selectedReservation.status === "confirmed" || selectedReservation.status === "change_requested") ? (
                    <button className={adminStyles.chipButton} type="button" onClick={() => openCancelPanel(selectedReservation)}>
                      キャンセル
                    </button>
                  ) : null}
                  {selectedReservation.status === "confirmed" ? (
                    <button
                      className={adminStyles.chipButton}
                      type="button"
                      onClick={() => updateReservation(selectedReservation.id, { status: "completed" })}
                      disabled={saving}
                    >
                      状態を完了にする
                    </button>
                  ) : null}
                </div>
                <div className={panelStyles.linkActionGroup}>
                  <a className={adminStyles.actionButton} href={`/admin/students/${selectedReservation.studentId}`}>
                    学生詳細へ
                  </a>
                  <a
                    className={adminStyles.actionButton}
                    href={
                      selectedReservation.lessonUnitId
                        ? `/admin/lesson-notes?lessonUnitId=${encodeURIComponent(selectedReservation.lessonUnitId)}`
                        : "/admin/lesson-notes"
                    }
                  >
                    レッスンノートへ
                  </a>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <section className={panelStyles.logsPanel}>
        <h3 className={panelStyles.detailTitle}>当日予約変更ログ</h3>
        {logsLoading ? <p className={adminStyles.smallMuted}>ログ読み込み中...</p> : null}
        {!logsLoading && recentReservationLogs.length === 0 ? (
          <p className={adminStyles.smallMuted}>該当ログがありません。</p>
        ) : (
          <ul className={adminStyles.tableLike}>
            {recentReservationLogs.slice(0, 12).map((log) => (
              <li key={log.id}>
                {String(log.at || "").slice(11, 16)} / {log.action}
                {log.summary ? ` / ${log.summary}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {openCreate ? (
        <div className={adminStyles.modalOverlay}>
          <div className={adminStyles.modalCard}>
            <h3 className={styles.sectionTitle}>予約追加</h3>
            <label className={styles.label}>
              予約タイプ
              <select
                className={styles.field}
                value={createForm.mode}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, mode: e.target.value }))}
              >
                <option value="single">単一予約</option>
                <option value="pair">ペア予約</option>
              </select>
            </label>
            <label className={styles.label}>
              スロット
              <select
                className={styles.field}
                value={createForm.slotId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, slotId: e.target.value }))}
              >
                <option value="">選択してください</option>
                {slotOptions.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.date} {slot.time} / {slot.lessonMode} / {slot.instructorName || "未割当"} / 残{slot.availableCount}
                  </option>
                ))}
              </select>
            </label>
            {createForm.mode === "pair" ? (
              <>
                <label className={styles.label}>
                  学生A
                  <select
                    className={styles.field}
                    value={createForm.studentAId}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, studentAId: e.target.value }))}
                  >
                    <option value="">選択してください</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nameKanji || "-"} / {student.email || "-"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  学生B
                  <select
                    className={styles.field}
                    value={createForm.studentBId}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, studentBId: e.target.value }))}
                  >
                    <option value="">選択してください</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nameKanji || "-"} / {student.email || "-"}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label className={styles.label}>
                学生
                <select
                  className={styles.field}
                  value={createForm.studentId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, studentId: e.target.value }))}
                >
                  <option value="">選択してください</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nameKanji || "-"} / {student.email || "-"}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.label}>
              レッスン形式
              <select
                className={styles.field}
                value={createForm.lessonDeliveryType}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, lessonDeliveryType: e.target.value }))}
              >
                <option value="in_person">対面</option>
                <option value="online">オンライン</option>
              </select>
            </label>
            <label className={styles.label}>
              メモ
              <input
                className={styles.field}
                value={createForm.memo}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, memo: e.target.value }))}
              />
            </label>
            <div className={adminStyles.compactActions}>
              <button className={styles.button} type="button" onClick={createReservation} disabled={saving}>
                保存
              </button>
              <button className={styles.button} type="button" onClick={() => setOpenCreate(false)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {openEdit ? (
        <div className={adminStyles.modalOverlay}>
          <div className={adminStyles.modalCard}>
            <h3 className={styles.sectionTitle}>予約変更</h3>
            <label className={styles.label}>
              新しいスロット
              <select
                className={styles.field}
                value={editForm.slotId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, slotId: e.target.value }))}
              >
                <option value="">選択してください</option>
                {slotOptions.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.date} {slot.time} / {slot.lessonMode} / {slot.instructorName || "未割当"}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              状態
              <select
                className={styles.field}
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="requested">承認待ち</option>
                <option value="confirmed">承認済み</option>
                <option value="change_requested">変更対応中</option>
                <option value="rejected">却下</option>
                <option value="scheduled">再調整待ち</option>
                <option value="cancelled">キャンセル</option>
                <option value="completed">完了</option>
              </select>
            </label>
            <label className={styles.label}>
              レッスン形式
              <select
                className={styles.field}
                value={editForm.lessonDeliveryType}
                onChange={(e) => setEditForm((prev) => ({ ...prev, lessonDeliveryType: e.target.value }))}
              >
                <option value="in_person">対面</option>
                <option value="online">オンライン</option>
              </select>
            </label>
            <label className={styles.label}>
              備考
              <input
                className={styles.field}
                value={editForm.memo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, memo: e.target.value }))}
              />
            </label>
            <div className={adminStyles.compactActions}>
              <button
                className={styles.button}
                type="button"
                onClick={async () => {
                  const ok = await updateReservation(editForm.id, {
                    slotId: editForm.slotId,
                    status: editForm.status,
                    lessonDeliveryType: editForm.lessonDeliveryType,
                    memo: editForm.memo,
                  });
                  if (ok) setOpenEdit(false);
                }}
                disabled={saving}
              >
                保存
              </button>
              <button className={styles.button} type="button" onClick={() => setOpenEdit(false)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {openCancel ? (
        <div className={adminStyles.modalOverlay}>
          <div className={adminStyles.modalCard}>
            <h3 className={styles.sectionTitle}>予約キャンセル</h3>
            <p className={styles.description}>この予約をキャンセルしますか？</p>
            <label className={styles.label}>
              <input
                type="checkbox"
                checked={cancelForm.notifyStudent}
                onChange={(e) => setCancelForm((prev) => ({ ...prev, notifyStudent: e.target.checked }))}
              />
              学生へ通知する
            </label>
            <label className={styles.label}>
              キャンセル理由 (任意)
              <input
                className={styles.field}
                value={cancelForm.reason}
                onChange={(e) => setCancelForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </label>
            <div className={adminStyles.compactActions}>
              <button
                className={styles.button}
                type="button"
                onClick={async () => {
                  const target = selectedReservation;
                  if (!target) return;
                  const nextMemo = cancelForm.reason
                    ? `${target.memo ? `${target.memo} / ` : ""}cancel:${cancelForm.reason}`
                    : target.memo;
                  const ok = await updateReservation(target.id, {
                    status: "cancelled",
                    memo: nextMemo,
                  });
                  if (ok) setOpenCancel(false);
                }}
                disabled={saving}
              >
                キャンセル確定
              </button>
              <button className={styles.button} type="button" onClick={() => setOpenCancel(false)}>
                戻る
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {overflowDate ? (
        <div className={adminStyles.modalOverlay}>
          <div className={adminStyles.modalCard}>
            <h3 className={styles.sectionTitle}>{overflowDate} の予約一覧</h3>
            <div className={panelStyles.dayList}>
              {scheduleItems
                .filter((item) => String(item.date || "") === overflowDate)
                .map((item) => (
                  <button
                    key={`overflow-${item.id}`}
                    type="button"
                    className={`${panelStyles.calendarEvent} ${panelStyles.calendarEventWide} ${panelStyles[`calendarEvent${statusTone(item.status).charAt(0).toUpperCase() + statusTone(item.status).slice(1)}`]}`}
                    onClick={() => {
                      setSelectedReservation(item);
                      setOverflowDate("");
                    }}
                  >
                    <strong>{item.time || "--:--"} / {item.studentNameKanji || "-"} / {statusLabel(item.status)}</strong>
                    <span className={panelStyles.calendarMeta}>
                      {item.instructorName || "講師未定"} / {deliveryLabel(item.lessonDeliveryType)} / {lessonTypeLabel(item)}
                    </span>
                  </button>
                ))}
            </div>
            <div className={adminStyles.compactActions}>
              <button className={styles.button} type="button" onClick={() => setOverflowDate("")}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

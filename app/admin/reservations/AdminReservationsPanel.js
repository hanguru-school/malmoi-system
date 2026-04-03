"use client";

import { useEffect, useMemo, useState } from "react";
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

function addDays(iso, amount) {
  const base = parseIso(iso) || parseIso(todayIso());
  base.setDate(base.getDate() + amount);
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

export default function AdminReservationsPanel({
  initialReservations,
  initialFilters = {},
  initialFocus = "",
  scopeNotice = "",
}) {
  const [selectedDate, setSelectedDate] = useState(initialFilters.fromDate || todayIso());
  const [scheduleView, setScheduleView] = useState("day");
  const [scheduleDate, setScheduleDate] = useState(initialFilters.fromDate || todayIso());
  const [viewMode, setViewMode] = useState("list");
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

  const scheduleItems = useMemo(
    () =>
      filteredReservations
        .filter((item) => scheduleRange.includes(item))
        .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`)),
    [filteredReservations, scheduleRange]
  );

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
      reservationParams.set("fromDate", selectedDate);
      reservationParams.set("toDate", selectedDate);
      reservationParams.set("page", "1");
      reservationParams.set("pageSize", "300");

      const slotsParams = new URLSearchParams();
      slotsParams.set("fromDate", selectedDate);
      slotsParams.set("toDate", selectedDate);

      const logsParams = new URLSearchParams();
      logsParams.set("targetType", "reservation");
      logsParams.set("fromDate", selectedDate);
      logsParams.set("toDate", selectedDate);
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
  }, [selectedDate]);

  useEffect(() => {
    setScheduleDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!initialFocus) return;
    if (initialFocus === "pending") {
      setStatusFilter("requested");
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

      <div className={panelStyles.schedulePanel}>
        <div className={panelStyles.scheduleHeader}>
          <h3 className={panelStyles.detailTitle}>予約スケジュール</h3>
          <span className={adminStyles.smallMuted}>{scheduleRange.label}</span>
        </div>
        <div className={panelStyles.scheduleToolbar}>
          <label className={styles.label}>
            基準日
            <input
              className={styles.field}
              type="date"
              value={scheduleDate}
              onChange={(e) => {
                setScheduleDate(e.target.value);
                setSelectedDate(e.target.value);
              }}
            />
          </label>
          <button className={adminStyles.chipButton} type="button" onClick={() => setScheduleDate(addDays(scheduleDate, -1))}>
            前へ
          </button>
          <button className={adminStyles.chipButton} type="button" onClick={() => setScheduleDate(addDays(scheduleDate, 1))}>
            次へ
          </button>
          <button
            className={adminStyles.chipButton}
            type="button"
            onClick={() => {
              const today = todayIso();
              setScheduleDate(today);
              setSelectedDate(today);
            }}
          >
            今日へ戻る
          </button>
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
          </div>
          <button className={styles.button} type="button" onClick={() => setOpenCreate(true)}>
            予約追加
          </button>
        </div>
        <div className={panelStyles.scheduleList}>
          {scheduleItems.slice(0, 16).map((item) => (
            <button
              key={`schedule-${item.id}`}
              type="button"
              className={`${panelStyles.scheduleItem} ${item.status === "requested" ? panelStyles.scheduleItemPending : ""}`}
              onClick={() => {
                setSelectedDate(item.date || selectedDate);
                setSelectedReservation(item);
              }}
            >
              <strong>
                {item.date} {item.time}
              </strong>
              <span>{item.studentNameKanji || "-"} / {lessonTypeLabel(item)}</span>
              <span>状態: {statusLabel(item.status)}</span>
            </button>
          ))}
          {scheduleItems.length === 0 ? <p className={adminStyles.smallMuted}>該当日程の予約はありません。</p> : null}
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
          {viewMode === "list" ? (
            <>
              <div className={panelStyles.mobileList}>
                {filteredReservations.map((item) => (
                  <article key={`card-${item.id}`} className={panelStyles.mobileListCard}>
                    <p className={panelStyles.mobileListHead}>
                      {item.time || "-"} / {item.studentNameKanji || "-"}
                    </p>
                    <p className={adminStyles.smallMuted}>
                      {item.studentNumber || "-"} / {item.instructorName || "-"} / {deliveryLabel(item.lessonDeliveryType)} /{" "}
                      {lessonTypeLabel(item)}
                    </p>
                    <p className={adminStyles.smallMuted}>状態: {statusLabel(item.status)}</p>
                    <div className={adminStyles.inlineLinks}>
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
                    <tr key={item.id} onClick={() => setSelectedReservation(item)} className={panelStyles.rowClickable}>
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
          ) : (
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
          )}
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
    </section>
  );
}

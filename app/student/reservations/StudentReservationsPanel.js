"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../login/login.module.css";

function slotLabel(slot) {
  const teacher = slot.instructorName ? ` / 担当 ${slot.instructorName}` : "";
  return `${slot.date} ${slot.time} / ${slot.durationMinutes}分${teacher}`;
}

function statusMeta(status, attendanceStatus) {
  if (status === "requested") return { label: "予約申請中", tone: "pending" };
  if (status === "confirmed") return { label: "予約確定", tone: "confirmed" };
  if (status === "change_requested") return { label: "変更依頼", tone: "scheduled" };
  if (status === "rejected") return { label: "却下", tone: "cancelled" };
  if (status === "completed") return { label: "完了", tone: "completed" };
  if (status === "cancelled") return { label: "キャンセル", tone: "cancelled" };
  if (attendanceStatus === "attended") return { label: "出席", tone: "attended" };
  if (attendanceStatus === "no_show" || attendanceStatus === "absent") return { label: "欠席", tone: "absent" };
  if (attendanceStatus === "scheduled") return { label: "予定", tone: "scheduled" };
  return { label: status || "-", tone: "scheduled" };
}

function lessonDeliveryLabel(type) {
  return type === "online" ? "オンラインレッスン" : "対面レッスン";
}

function toMinutes(time) {
  const [hh, mm] = String(time || "00:00")
    .split(":")
    .map((v) => Number(v || 0));
  return hh * 60 + mm;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(value) {
  const [y, m, d] = String(value || "1970-01-01")
    .split("-")
    .map((v) => Number(v || 0));
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function blockedText(code) {
  if (code === "cutoff_passed") return "締切時間を過ぎたため、直接処理できません。";
  if (code === "status_not_changeable") return "現在の状態では変更できません。";
  if (code === "status_not_cancellable") return "現在の状態ではキャンセルできません。";
  if (code === "attendance_locked") return "出席処理済みの予約は学生が直接変更/キャンセルできません。";
  return "";
}

export default function StudentReservationsPanel() {
  const INSTRUCTOR_NO_PREFERENCE = "__no_preference__";
  const [reservations, setReservations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [instructorAssignmentMode, setInstructorAssignmentMode] = useState("auto");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({
    slotId: "",
    lessonDeliveryType: "in_person",
    memo: "",
  });
  const [rescheduleSlotByReservation, setRescheduleSlotByReservation] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, 365), [today]);
  const bookableSlots = useMemo(() => slots.filter((slot) => slot.isBookable), [slots]);
  const teacherOptions = useMemo(() => {
    const map = new Map();
    slots.forEach((slot) => {
      if (!slot.instructorUserId) return;
      map.set(slot.instructorUserId, {
        id: slot.instructorUserId,
        name: slot.instructorName || "未設定",
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [slots]);
  const canStudentSelectInstructor = instructorAssignmentMode === "student_select" || instructorAssignmentMode === "hybrid";
  const filteredByCourse = slots;
  const filteredByTeacher = useMemo(() => {
    if (!canStudentSelectInstructor) return filteredByCourse;
    if (teacherOptions.length === 0) return filteredByCourse;
    if (!selectedTeacherId || selectedTeacherId === INSTRUCTOR_NO_PREFERENCE) return filteredByCourse;
    return filteredByCourse.filter((slot) => slot.instructorUserId === selectedTeacherId);
  }, [INSTRUCTOR_NO_PREFERENCE, canStudentSelectInstructor, filteredByCourse, selectedTeacherId, teacherOptions.length]);

  const dateStatsMap = useMemo(() => {
    const map = new Map();
    filteredByTeacher.forEach((slot) => {
      if (!slot.date) return;
      const dateObj = parseDateKey(slot.date);
      if (dateObj < today || dateObj > maxDate) return;
      const prev = map.get(slot.date) || { hasAny: false, hasBookable: false };
      prev.hasAny = true;
      prev.hasBookable = prev.hasBookable || Boolean(slot.isBookable);
      map.set(slot.date, prev);
    });
    return map;
  }, [filteredByTeacher, today, maxDate]);

  const availableDateKeys = useMemo(() => [...dateStatsMap.keys()].sort(), [dateStatsMap]);
  const firstBookableDate = useMemo(
    () => availableDateKeys.find((date) => dateStatsMap.get(date)?.hasBookable) || "",
    [availableDateKeys, dateStatsMap]
  );

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredByTeacher
      .filter((slot) => slot.date === selectedDate)
      .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  }, [filteredByTeacher, selectedDate]);
  const selectedSlot = useMemo(
    () => slotsForDate.find((slot) => slot.id === form.slotId) || null,
    [slotsForDate, form.slotId]
  );
  const instructorGuideText = useMemo(() => {
    if (!canStudentSelectInstructor) return "講師は教室で調整のうえご案内します。";
    return "講師を指定しない場合は、教室で調整のうえご案内します。";
  }, [canStudentSelectInstructor]);
  const currentStep = useMemo(() => {
    if (!selectedDate) return 1;
    if (!form.slotId) return 2;
    if (!form.lessonDeliveryType) return 3;
    return 4;
  }, [form.lessonDeliveryType, form.slotId, selectedDate]);
  const progressSteps = useMemo(
    () => [
      { id: 1, title: "日付" },
      { id: 2, title: "時間" },
      { id: 3, title: "レッスン形式" },
      { id: 4, title: "確認" },
    ],
    []
  );

  const calendarCells = useMemo(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const leading = start.getDay();
    const cells = [];

    for (let i = 0; i < leading; i += 1) {
      cells.push({ key: `lead-${i}`, blank: true });
    }

    for (let day = 1; day <= end.getDate(); day += 1) {
      const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const key = formatDateKey(current);
      const outOfRange = current < today || current > maxDate;
      const stats = dateStatsMap.get(key) || { hasAny: false, hasBookable: false };
      cells.push({
        key,
        blank: false,
        dateKey: key,
        label: String(day),
        outOfRange,
        hasAny: stats.hasAny,
        hasBookable: stats.hasBookable,
        selected: selectedDate === key,
      });
    }
    return cells;
  }, [calendarMonth, dateStatsMap, maxDate, selectedDate, today]);

  async function loadReservations() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const response = await fetch(`/api/student/reservations?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "予約の取得に失敗しました。");
    setReservations(data.reservations || []);
  }

  async function loadSlots() {
    const response = await fetch(`/api/student/reservation-slots`);
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "予約可能時間の取得に失敗しました。");
    setSlots(data.slots || []);
    setInstructorAssignmentMode(data?.reservationPolicy?.instructorAssignmentMode || "auto");
  }

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([loadReservations(), loadSlots()]);
    } catch (err) {
      setError(err.message || "予約取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // statusFilter change should reload list and slots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!canStudentSelectInstructor) {
      if (selectedTeacherId) setSelectedTeacherId("");
      return;
    }
    if (!selectedTeacherId) {
      setSelectedTeacherId(INSTRUCTOR_NO_PREFERENCE);
      return;
    }
    if (selectedTeacherId !== INSTRUCTOR_NO_PREFERENCE && teacherOptions.length > 0) {
      const exists = teacherOptions.some((teacher) => teacher.id === selectedTeacherId);
      if (!exists) setSelectedTeacherId(INSTRUCTOR_NO_PREFERENCE);
    }
    if (teacherOptions.length === 0 && selectedTeacherId && selectedTeacherId !== INSTRUCTOR_NO_PREFERENCE) {
      setSelectedTeacherId("");
    }
  }, [INSTRUCTOR_NO_PREFERENCE, canStudentSelectInstructor, selectedTeacherId, teacherOptions]);

  useEffect(() => {
    if (!selectedDate) {
      if (firstBookableDate) setSelectedDate(firstBookableDate);
      else if (availableDateKeys.length > 0) setSelectedDate(availableDateKeys[0]);
      return;
    }
    if (!dateStatsMap.has(selectedDate)) {
      if (firstBookableDate) setSelectedDate(firstBookableDate);
      else if (availableDateKeys.length > 0) setSelectedDate(availableDateKeys[0]);
      else setSelectedDate("");
    }
  }, [selectedDate, availableDateKeys, dateStatsMap, firstBookableDate]);

  useEffect(() => {
    if (!selectedDate) return;
    const picked = parseDateKey(selectedDate);
    setCalendarMonth(new Date(picked.getFullYear(), picked.getMonth(), 1));
  }, [selectedDate]);

  useEffect(() => {
    if (!form.slotId) {
      const firstBookable = slotsForDate.find((slot) => slot.isBookable);
      if (firstBookable) setForm((prev) => ({ ...prev, slotId: firstBookable.id }));
    }
  }, [slotsForDate, form.slotId]);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const selectedSlot = slotsForDate.find((slot) => slot.id === form.slotId);
      if (!selectedSlot || !selectedSlot.isBookable) {
        throw new Error("予約可能な時間を選択してください。");
      }
      const response = await fetch("/api/student/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "予約作成に失敗しました。");

      setForm((prev) => ({ ...prev, memo: "" }));
      await loadAll();
    } catch (err) {
      setError(err.message || "予約作成中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleReschedule(id) {
    const slotId = rescheduleSlotByReservation[id];
    if (!slotId) return;

    setError("");
    try {
      const response = await fetch(`/api/student/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "予約変更に失敗しました。");
      await loadAll();
    } catch (err) {
      setError(err.message || "予約変更中にエラーが発生しました。");
    }
  }

  async function handleCancel(id) {
    setError("");
    try {
      const response = await fetch(`/api/student/reservations/${id}/cancel`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "予約キャンセルに失敗しました。");
      await loadAll();
    } catch (err) {
      setError(err.message || "予約キャンセル中にエラーが発生しました。");
    }
  }

  return (
    <>
      <form onSubmit={handleCreate}>
        <h2 className={styles.sectionTitle}>予約作成 (段階選択)</h2>
        <div className={styles.stepGuide}>
          {progressSteps.map((step) => (
            <span
              key={step.id}
              className={`${styles.stepItem} ${
                step.id < currentStep ? styles.stepItemDone : step.id === currentStep ? styles.stepItemActive : ""
              }`}
            >
              {step.id}. {step.title}
            </span>
          ))}
        </div>
        <div className={styles.selectionSummary}>
          <p>選択中の日付: {selectedDate || "未選択"}</p>
          <p>選択中の時間: {selectedSlot?.time || "未選択"}</p>
          <p>授業タイプ: {form.lessonDeliveryType ? lessonDeliveryLabel(form.lessonDeliveryType) : "未選択"}</p>
          <p>{instructorGuideText}</p>
        </div>
        <label className={styles.label}>
          1. 日付選択
          <div className={styles.calendarHeader}>
            <button
              className={styles.optionButton}
              type="button"
              onClick={() =>
                setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              disabled={new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1) <= new Date(today.getFullYear(), today.getMonth(), 1)}
            >
              前の月
            </button>
            <strong>
              {calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月
            </strong>
            <button
              className={styles.optionButton}
              type="button"
              onClick={() =>
                setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              disabled={new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0) >= maxDate}
            >
              次の月
            </button>
          </div>
          <div className={styles.calendarWeekdays}>
            {["日", "月", "火", "水", "木", "金", "土"].map((week) => (
              <span key={week}>{week}</span>
            ))}
          </div>
          <div className={styles.calendarGrid}>
            {calendarCells.map((cell) => {
              if (cell.blank) return <span key={cell.key} className={styles.calendarBlank} />;
              const disabled = cell.outOfRange || !cell.hasAny;
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={disabled}
                  className={`${styles.calendarDay} ${
                    cell.selected
                      ? styles.calendarDaySelected
                      : disabled
                        ? styles.calendarDayUnavailable
                        : cell.hasBookable
                          ? styles.calendarDayAvailable
                          : styles.calendarDayLimited
                  }`}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedDate(cell.dateKey);
                    setForm((prev) => ({ ...prev, slotId: "" }));
                  }}
                >
                  {cell.label}
                </button>
              );
            })}
          </div>
          {!selectedDate ? <p className={styles.description}>日付を選択してください。</p> : null}
        </label>
        <label className={styles.label}>
          2. 時間選択
          {selectedDate ? null : <p className={styles.stepNote}>先に日付を選択してください。</p>}
          <div className={styles.timeGrid}>
            {slotsForDate.map((slot) => (
              <button
                key={slot.id}
                className={`${styles.timeBlock} ${
                  !slot.isBookable
                    ? styles.timeBlockUnavailable
                    : form.slotId === slot.id
                      ? styles.timeBlockSelected
                      : styles.timeBlockAvailable
                }`}
                type="button"
                disabled={!slot.isBookable}
                onClick={() => setForm((prev) => ({ ...prev, slotId: slot.id }))}
                title={slotLabel(slot)}
              >
                {slot.time}
              </button>
            ))}
            {slotsForDate.length === 0 ? <p>選択可能な時間がありません。</p> : null}
          </div>
          <p className={styles.description}>緑: 予約可能 / 灰: 予約不可 / 青: 選択中</p>
        </label>
        <label className={styles.label}>
          3. レッスン形式
          <div className={styles.optionGrid}>
            {[
              { id: "in_person", label: "対面レッスン" },
              { id: "online", label: "オンラインレッスン" },
            ].map((option) => {
              const selected = form.lessonDeliveryType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.optionButton} ${selected ? styles.optionButtonSelected : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, lessonDeliveryType: option.id }))}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </label>
        <label className={styles.label}>
          伝えたいこと
          <input
            className={styles.field}
            value={form.memo}
            onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
            placeholder="レッスン前に伝えておきたい内容があれば入力してください。"
          />
        </label>
        <button className={styles.button} type="submit" disabled={saving || bookableSlots.length === 0}>
          {saving ? "作成中..." : "4. 予約作成"}
        </button>
        {bookableSlots.length === 0 ? <p>現在予約可能なスロットがありません。</p> : null}
      </form>

      <h2 className={styles.sectionTitle}>自分の予約</h2>
      <label className={styles.label}>
        状態フィルター
        <select
          className={styles.field}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全体</option>
          <option value="requested">予約申請中</option>
          <option value="confirmed">予約確定</option>
          <option value="change_requested">変更依頼</option>
          <option value="rejected">却下</option>
          <option value="cancelled">キャンセル</option>
          <option value="completed">完了</option>
        </select>
      </label>

      {loading ? <p>読み込み中...</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <div className={styles.links}>
        {reservations.map((item) => {
          const selfService = item.selfService || {};
          const status = statusMeta(item.status, item.attendanceStatus);
          const statusClassName =
            status.tone === "pending"
              ? styles.reservationStatusPending
              : status.tone === "confirmed"
                ? styles.reservationStatusConfirmed
                : status.tone === "completed"
                  ? styles.reservationStatusCompleted
                : status.tone === "cancelled"
                  ? styles.reservationStatusCancelled
                  : status.tone === "attended"
                    ? styles.reservationStatusAttended
                    : status.tone === "absent"
                      ? styles.reservationStatusAbsent
                      : styles.reservationStatusScheduled;
          return (
            <article key={item.id} className={styles.reservationCard}>
              <div className={styles.reservationCardHead}>
                <p className={styles.reservationDate}>{item.date || "-"}</p>
                <p className={styles.reservationTime}>{item.time || "-"}</p>
                <span className={`${styles.reservationStatusBadge} ${statusClassName}`}>{status.label}</span>
              </div>
              <div className={styles.reservationMeta}>
                <p>授業タイプ: {lessonDeliveryLabel(item.lessonDeliveryType)}</p>
                <p>担当講師: {item.instructorName || "-"}</p>
                <p>変更可否: {selfService.canStudentChange ? "可能" : "不可"}</p>
                <p>キャンセル可否: {selfService.canStudentCancel ? "可能" : "不可"}</p>
              </div>

              <div className={styles.reservationActions}>
                {selfService.canStudentChange ? (
                  <>
                    <select
                      className={styles.field}
                      value={rescheduleSlotByReservation[item.id] || ""}
                      onChange={(e) =>
                        setRescheduleSlotByReservation((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    >
                      <option value="">変更するスロットを選択</option>
                      {bookableSlots
                        .filter((slot) => slot.id !== item.slotId)
                        .map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slotLabel(slot)}
                          </option>
                        ))}
                    </select>
                    <button className={styles.button} type="button" onClick={() => handleReschedule(item.id)}>
                      予約変更
                    </button>
                  </>
                ) : null}

                {selfService.canStudentCancel ? (
                  <button className={styles.button} type="button" onClick={() => handleCancel(item.id)}>
                    キャンセル
                  </button>
                ) : null}
              </div>
              {(!selfService.canStudentChange || !selfService.canStudentCancel) &&
              (selfService.blockedReasonChange || selfService.blockedReasonCancel) ? (
                <p className={styles.reservationHint}>
                  {blockedText(selfService.blockedReasonChange || selfService.blockedReasonCancel)}
                </p>
              ) : null}
            </article>
          );
        })}
        {!loading && reservations.length === 0 ? <p>予約がありません。</p> : null}
      </div>
    </>
  );
}

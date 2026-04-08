"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDaysYmd } from "../../../lib/admin/reservationCalendarModel.js";
import { explainUnavailableReason } from "../../../lib/reservations/engine/reasonCodes.js";
import styles from "../../login/login.module.css";

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

function startOfMonthYmd(calendarMonth) {
  return formatDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
}

function endOfMonthYmd(calendarMonth) {
  const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  return formatDateKey(d);
}

function blockedText(code) {
  if (code === "cutoff_passed") return "締切時間を過ぎたため、直接処理できません。";
  if (code === "status_not_changeable") return "現在の状態では変更できません。";
  if (code === "status_not_cancellable") return "現在の状態ではキャンセルできません。";
  if (code === "attendance_locked") return "出席処理済みの予約は学生が直接変更/キャンセルできません。";
  return "";
}

function formatPt(n) {
  return `${Math.max(0, Number(n || 0)).toLocaleString("ja-JP")}pt`;
}

export default function StudentReservationsPanel() {
  const INSTRUCTOR_NO_PREFERENCE = "__no_preference__";
  const [reservations, setReservations] = useState([]);
  const [lessonTypes, setLessonTypes] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [studentSnapshot, setStudentSnapshot] = useState(null);
  const [instructorAssignmentMode, setInstructorAssignmentMode] = useState("auto");
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [form, setForm] = useState({
    slotId: "",
    lessonDeliveryType: "in_person",
    memo: "",
  });
  const [rescheduleSlotByReservation, setRescheduleSlotByReservation] = useState({});
  const [rescheduleOptions, setRescheduleOptions] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, 365), [today]);
  const selectedLesson = useMemo(
    () => lessonTypes.find((l) => l.id === selectedLessonId) || null,
    [lessonTypes, selectedLessonId]
  );

  const canStudentSelectInstructor =
    instructorAssignmentMode === "student_select" || instructorAssignmentMode === "hybrid";
  const teacherOptions = useMemo(() => {
    const ids = selectedLesson?.teacherUserIds || [];
    if (!ids.length) return [];
    return ids.map((id) => ({ id, name: id }));
  }, [selectedLesson]);

  const dateStatsMap = useMemo(() => {
    const map = new Map();
    candidates.forEach((c) => {
      const dk = String(c.date || "").slice(0, 10);
      if (!dk) return;
      const dateObj = parseDateKey(dk);
      if (dateObj < today || dateObj > maxDate) return;
      const prev = map.get(dk) || { hasAny: false, hasBookable: false };
      prev.hasAny = true;
      prev.hasBookable = prev.hasBookable || Boolean(c.bookingOk);
      map.set(dk, prev);
    });
    return map;
  }, [candidates, today, maxDate]);

  const availableDateKeys = useMemo(() => [...dateStatsMap.keys()].sort(), [dateStatsMap]);
  const firstBookableDate = useMemo(
    () => availableDateKeys.find((date) => dateStatsMap.get(date)?.hasBookable) || "",
    [availableDateKeys, dateStatsMap]
  );

  const candidatesForDate = useMemo(() => {
    if (!selectedDate) return [];
    return candidates
      .filter((c) => String(c.date || "").slice(0, 10) === selectedDate)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }, [candidates, selectedDate]);

  const selectedCandidate = useMemo(
    () => candidatesForDate.find((c) => c.slotId === form.slotId) || null,
    [candidatesForDate, form.slotId]
  );

  const currentStep = useMemo(() => {
    if (!selectedLessonId) return 1;
    if (!selectedDate) return 2;
    if (!form.slotId) return 3;
    if (!form.lessonDeliveryType) return 4;
    return 5;
  }, [form.lessonDeliveryType, form.slotId, selectedDate, selectedLessonId]);

  const progressSteps = useMemo(
    () => [
      { id: 1, title: "レッスン" },
      { id: 2, title: "日付" },
      { id: 3, title: "時間" },
      { id: 4, title: "形式" },
      { id: 5, title: "確認" },
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

  const loadReservations = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const response = await fetch(`/api/student/reservations?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "予約の取得に失敗しました。");
    setReservations(data.reservations || []);
  }, [statusFilter]);

  const loadBootstrap = useCallback(async () => {
    const [slotRes, ltRes] = await Promise.all([
      fetch("/api/student/reservation-slots", { cache: "no-store" }),
      fetch("/api/student/lesson-types", { cache: "no-store" }),
    ]);
    const slotData = await slotRes.json();
    const ltData = await ltRes.json();
    if (slotRes.ok && slotData?.ok) {
      setInstructorAssignmentMode(slotData?.reservationPolicy?.instructorAssignmentMode || "auto");
    }
    if (ltRes.ok && ltData?.ok) {
      setLessonTypes(ltData.lessonTypes || []);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    if (!selectedLessonId) {
      setCandidates([]);
      setStudentSnapshot(null);
      return;
    }
    setCandidatesLoading(true);
    try {
      const fromDate = startOfMonthYmd(calendarMonth);
      const toDate = endOfMonthYmd(calendarMonth);
      const sp = new URLSearchParams();
      sp.set("lessonTypeId", selectedLessonId);
      sp.set("fromDate", fromDate);
      sp.set("toDate", toDate);
      sp.set("lessonMode", form.lessonDeliveryType || "in_person");
      if (selectedTeacherId && selectedTeacherId !== INSTRUCTOR_NO_PREFERENCE) {
        sp.set("teacherId", selectedTeacherId);
      }
      const response = await fetch(`/api/student/reservation-candidates?${sp.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "候補の取得に失敗しました。");
      setCandidates(data.candidates || []);
      setStudentSnapshot(data.studentSnapshot || null);
    } catch (e) {
      setError(e.message || "候補の取得に失敗しました。");
      setCandidates([]);
      setStudentSnapshot(null);
    } finally {
      setCandidatesLoading(false);
    }
  }, [calendarMonth, form.lessonDeliveryType, selectedLessonId, selectedTeacherId, INSTRUCTOR_NO_PREFERENCE]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadReservations(), loadBootstrap()]);
    } catch (err) {
      setError(err.message || "予約取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

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
      const firstOk = candidatesForDate.find((c) => c.bookingOk);
      if (firstOk) setForm((prev) => ({ ...prev, slotId: firstOk.slotId }));
    }
  }, [candidatesForDate, form.slotId]);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const pick = candidatesForDate.find((c) => c.slotId === form.slotId);
      if (!pick || !pick.bookingOk) {
        throw new Error("予約可能な候補を選択してください。");
      }
      const response = await fetch("/api/student/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: form.slotId,
          lessonServiceId: selectedLessonId,
          lessonDeliveryType: form.lessonDeliveryType,
          memo: form.memo,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "予約作成に失敗しました。");

      setForm((prev) => ({ ...prev, memo: "" }));
      await loadAll();
      await loadCandidates();
    } catch (err) {
      setError(err.message || "予約作成中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  async function ensureRescheduleOptions(reservation) {
    const rid = reservation.id;
    if (rescheduleOptions[rid]?.length) return;
    const lid =
      reservation.lessonServiceId ||
      lessonTypes.find((l) => l.durationMinutes === reservation.durationMinutes)?.id ||
      "";
    if (!lid) {
      setRescheduleOptions((prev) => ({ ...prev, [rid]: [] }));
      return;
    }
    const fromDate = formatDateKey(today);
    const toDate = addDaysYmd(fromDate, 21);
    const sp = new URLSearchParams();
    sp.set("lessonTypeId", lid);
    sp.set("fromDate", fromDate);
    sp.set("toDate", toDate);
    sp.set("lessonMode", reservation.lessonDeliveryType || "in_person");
    try {
      const response = await fetch(`/api/student/reservation-candidates?${sp.toString()}`, { cache: "no-store" });
      const data = await response.json();
      const opts = (data.candidates || []).filter((c) => c.bookingOk && c.slotId !== reservation.slotId);
      setRescheduleOptions((prev) => ({ ...prev, [rid]: opts }));
    } catch {
      setRescheduleOptions((prev) => ({ ...prev, [rid]: [] }));
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
      await loadCandidates();
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
      await loadCandidates();
    } catch (err) {
      setError(err.message || "予約キャンセル中にエラーが発生しました。");
    }
  }

  const remMin = studentSnapshot?.remainingMinutes ?? null;
  const remPt = studentSnapshot?.currentPoints ?? null;

  return (
    <>
      <form onSubmit={handleCreate}>
        <h2 className={styles.sectionTitle}>予約作成（候補ベース）</h2>
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
        {(remMin != null || remPt != null) && (
          <div className={styles.selectionSummary}>
            <p>
              参考: 残り時間 {remMin != null ? `${remMin}分` : "—"} / 保有ポイント {remPt != null ? formatPt(remPt) : "—"}
            </p>
          </div>
        )}

        <label className={styles.label}>
          1. レッスン
          <div className={styles.optionGrid}>
            {lessonTypes.length === 0 ? <p className={styles.description}>利用可能なレッスンがありません。</p> : null}
            {lessonTypes.map((lt) => {
              const selected = selectedLessonId === lt.id;
              return (
                <button
                  key={lt.id}
                  type="button"
                  className={`${styles.optionButton} ${selected ? styles.optionButtonSelected : ""}`}
                  onClick={() => {
                    setSelectedLessonId(lt.id);
                    setForm((prev) => ({ ...prev, slotId: "" }));
                    setSelectedDate("");
                  }}
                >
                  {lt.displayName}（{lt.durationMinutes}分 / {formatPt(lt.pointCost)}）
                </button>
              );
            })}
          </div>
        </label>

        {canStudentSelectInstructor && teacherOptions.length > 0 ? (
          <label className={styles.label}>
            講師（任意）
            <select
              className={styles.field}
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              <option value={INSTRUCTOR_NO_PREFERENCE}>指定なし</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className={styles.label}>
          2. 日付選択
          {!selectedLessonId ? <p className={styles.stepNote}>先にレッスンを選択してください。</p> : null}
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
          {candidatesLoading ? <p className={styles.description}>候補を読み込み中…</p> : null}
        </label>

        <label className={styles.label}>
          3. 時間候補
          {!selectedDate ? <p className={styles.stepNote}>日付を選択してください。</p> : null}
          <div className={styles.timeGrid}>
            {candidatesForDate.map((c) => {
              const ok = Boolean(c.bookingOk);
              return (
                <div key={c.slotId} className={styles.candidateWrap}>
                  <button
                    className={`${styles.timeBlock} ${
                      !ok ? styles.timeBlockUnavailable : form.slotId === c.slotId ? styles.timeBlockSelected : styles.timeBlockAvailable
                    }`}
                    type="button"
                    disabled={!ok}
                    onClick={() => setForm((prev) => ({ ...prev, slotId: c.slotId }))}
                  >
                    <div>
                      [{c.startTime} – {c.endTime}]
                    </div>
                    <div className={styles.candidateSub}>{c.teacherName || "講師"}</div>
                    <div className={styles.candidateSub}>
                      {c.durationMinutes || selectedLesson?.durationMinutes}分 {formatPt(c.pointCost)}
                    </div>
                    {ok && (c.remainingMinutesAfterBooking != null || c.remainingPointsAfterBooking != null) ? (
                      <div className={styles.candidateRemain}>
                        残り {c.remainingMinutesAfterBooking != null ? `${c.remainingMinutesAfterBooking}分` : "—"}
                        {c.remainingPointsAfterBooking != null ? `（${formatPt(c.remainingPointsAfterBooking)}）` : ""}
                      </div>
                    ) : null}
                  </button>
                  {!ok ? (
                    <div className={styles.reasonBadgeRow}>
                      {(c.reasonCodes || []).slice(0, 4).map((code) => (
                        <span key={code} className={styles.reasonBadge}>
                          {explainUnavailableReason(code)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {selectedDate && candidatesForDate.length === 0 && !candidatesLoading ? (
              <p>この日の候補がありません。</p>
            ) : null}
          </div>
        </label>

        <label className={styles.label}>
          4. レッスン形式
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
        <button
          className={styles.button}
          type="submit"
          disabled={saving || !selectedCandidate?.bookingOk || !selectedLessonId}
        >
          {saving ? "作成中..." : "5. 予約作成"}
        </button>
        {!selectedLessonId ? <p>レッスンを選択してください。</p> : null}
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
          const ro = rescheduleOptions[item.id] || null;
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
                      onFocus={() => ensureRescheduleOptions(item)}
                      onChange={(e) =>
                        setRescheduleSlotByReservation((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    >
                      <option value="">変更する候補を選択</option>
                      {(ro || []).map((c) => (
                        <option key={c.slotId} value={c.slotId}>
                          {c.date} {c.startTime}〜 {c.teacherName || ""} / {formatPt(c.pointCost)}
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

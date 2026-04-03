"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";
import v2 from "./student-reservations-v2.module.css";
import {
  addDays,
  blockedText,
  buildStudentReservationCreatePayload,
  formatDateKey,
  lessonDeliveryLabel,
  parseDateKey,
  slotLabel,
  startOfDay,
  statusMeta,
  toMinutes,
} from "../../../lib/student/reservationUiAdapter";

const INSTRUCTOR_NO_PREFERENCE = "__no_preference__";

function badgeClass(tone) {
  if (tone === "pending") return v2.badgePending;
  if (tone === "confirmed") return v2.badgeConfirmed;
  if (tone === "cancelled") return v2.badgeCancelled;
  if (tone === "completed") return v2.badgeCompleted;
  return v2.badgeScheduled;
}

export default function StudentReservationsPanelV2() {
  const [mainTab, setMainTab] = useState("reserve");
  const [wizardStep, setWizardStep] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  const canStudentSelectInstructor =
    instructorAssignmentMode === "student_select" || instructorAssignmentMode === "hybrid";
  const filteredByCourse = slots;
  const filteredByTeacher = useMemo(() => {
    if (!canStudentSelectInstructor) return filteredByCourse;
    if (teacherOptions.length === 0) return filteredByCourse;
    if (!selectedTeacherId || selectedTeacherId === INSTRUCTOR_NO_PREFERENCE) return filteredByCourse;
    return filteredByCourse.filter((slot) => slot.instructorUserId === selectedTeacherId);
  }, [canStudentSelectInstructor, filteredByCourse, selectedTeacherId, teacherOptions.length]);

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
  }, [canStudentSelectInstructor, selectedTeacherId, teacherOptions]);

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

  async function submitReservation() {
    setSaving(true);
    setError("");
    try {
      const picked = slotsForDate.find((slot) => slot.id === form.slotId);
      if (!picked || !picked.isBookable) {
        throw new Error("予約可能な時間を選択してください。");
      }
      const payload = buildStudentReservationCreatePayload(form);
      const response = await fetch("/api/student/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "予約作成に失敗しました。");
      setForm((prev) => ({ ...prev, memo: "" }));
      setConfirmOpen(false);
      setWizardStep(4);
      await loadAll();
    } catch (err) {
      setError(err.message || "予約作成中にエラーが発生しました。");
      setConfirmOpen(false);
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

  function resetWizard() {
    setWizardStep(1);
    setConfirmOpen(false);
    setForm((prev) => ({ ...prev, memo: "" }));
  }

  const canNextFromStep1 = Boolean(selectedDate);
  const canNextFromStep2 = Boolean(form.slotId && selectedSlot?.isBookable);
  const canNextFromStep3 = Boolean(form.lessonDeliveryType);

  const manageReservations = useMemo(
    () =>
      reservations.filter(
        (item) =>
          item.selfService?.canStudentChange ||
          item.selfService?.canStudentCancel ||
          item.status === "requested" ||
          item.status === "confirmed" ||
          item.status === "change_requested"
      ),
    [reservations]
  );

  function renderReservationCard(item, { compactActions = false } = {}) {
    const selfService = item.selfService || {};
    const st = statusMeta(item.status, item.attendanceStatus);
    return (
      <article key={item.id} className={v2.listCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <strong>
              {item.date} {item.time}
            </strong>
            <p className={v2.hint}>
              {lessonDeliveryLabel(item.lessonDeliveryType)} / 担当: {item.instructorName || "-"}
            </p>
          </div>
          <span className={`${v2.badge} ${badgeClass(st.tone)}`}>{st.label}</span>
        </div>
        {!compactActions ? (
          <p className={v2.hint}>
            変更: {selfService.canStudentChange ? "可" : "不可"} / キャンセル: {selfService.canStudentCancel ? "可" : "不可"}
          </p>
        ) : null}
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {selfService.canStudentChange ? (
            <>
              <select
                className={`${styles.field} ${v2.field}`}
                value={rescheduleSlotByReservation[item.id] || ""}
                onChange={(e) =>
                  setRescheduleSlotByReservation((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
              >
                <option value="">変更先の時間を選択</option>
                {bookableSlots
                  .filter((slot) => slot.id !== item.slotId)
                  .map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slotLabel(slot)}
                    </option>
                  ))}
              </select>
              <button className={styles.button} type="button" onClick={() => handleReschedule(item.id)}>
                予約を変更する
              </button>
            </>
          ) : null}
          {selfService.canStudentCancel ? (
            <button className={styles.button} type="button" onClick={() => handleCancel(item.id)}>
              キャンセルする
            </button>
          ) : null}
          {(!selfService.canStudentChange || !selfService.canStudentCancel) &&
          (selfService.blockedReasonChange || selfService.blockedReasonCancel) ? (
            <p className={styles.description}>{blockedText(selfService.blockedReasonChange || selfService.blockedReasonCancel)}</p>
          ) : null}
        </div>
      </article>
    );
  }

  const stepTitle = ["", "日付を選ぶ", "時間を選ぶ", "内容を確認", "完了"][wizardStep] || "";

  return (
    <div className={v2.root}>
      <div className={v2.tabBar} role="tablist" aria-label="予約メニュー">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "reserve"}
          className={`${v2.tab} ${mainTab === "reserve" ? v2.tabActive : ""}`}
          onClick={() => {
            setMainTab("reserve");
            if (wizardStep === 4) resetWizard();
          }}
        >
          予約する
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "list"}
          className={`${v2.tab} ${mainTab === "list" ? v2.tabActive : ""}`}
          onClick={() => setMainTab("list")}
        >
          予約一覧
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "manage"}
          className={`${v2.tab} ${mainTab === "manage" ? v2.tabActive : ""}`}
          onClick={() => setMainTab("manage")}
        >
          キャンセル・変更
        </button>
      </div>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {loading ? <p className={styles.description}>読み込み中...</p> : null}

      {mainTab === "reserve" ? (
        <>
          {wizardStep < 4 ? (
            <div className={v2.wizardHeader}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                {stepTitle}
              </h2>
              <div className={v2.stepDots} aria-hidden>
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`${v2.stepDot} ${wizardStep === s ? v2.stepDotActive : ""} ${
                      wizardStep > s ? v2.stepDotDone : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {wizardStep === 1 ? (
            <section>
              {canStudentSelectInstructor && teacherOptions.length > 0 ? (
                <label className={styles.label}>
                  講師（任意）
                  <select
                    className={styles.field}
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                  >
                    <option value={INSTRUCTOR_NO_PREFERENCE}>指定なし（教室で調整）</option>
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className={styles.label}>
                日付
                <div className={v2.calendarHeader}>
                  <button
                    className={styles.optionButton}
                    type="button"
                    onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    disabled={
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1) <=
                      new Date(today.getFullYear(), today.getMonth(), 1)
                    }
                  >
                    前月
                  </button>
                  <strong>
                    {calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月
                  </strong>
                  <button
                    className={styles.optionButton}
                    type="button"
                    onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    disabled={
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0) >= maxDate
                    }
                  >
                    翌月
                  </button>
                </div>
                <div className={v2.calendarWeekdays}>
                  {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
                <div className={v2.calendarGrid}>
                  {calendarCells.map((cell) => {
                    if (cell.blank) return <span key={cell.key} className={v2.calendarBlank} />;
                    const disabled = cell.outOfRange || !cell.hasAny;
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        disabled={disabled}
                        className={`${v2.calendarDay} ${
                          cell.selected
                            ? v2.calendarDaySelected
                            : disabled
                              ? v2.calendarDayUnavailable
                              : cell.hasBookable
                                ? v2.calendarDayAvailable
                                : v2.calendarDayLimited
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
              </label>
            </section>
          ) : null}

          {wizardStep === 2 ? (
            <section>
              <p className={styles.description}>{selectedDate} の時間を選んでください。</p>
              <div className={v2.timeGrid}>
                {slotsForDate.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.isBookable}
                    className={`${v2.timeBtn} ${form.slotId === slot.id ? v2.timeBtnSelected : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, slotId: slot.id }))}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              {slotsForDate.length === 0 ? <p className={styles.description}>この日は枠がありません。</p> : null}
            </section>
          ) : null}

          {wizardStep === 3 ? (
            <section>
              <div className={v2.summaryCard}>
                <p>
                  <strong>日付:</strong> {selectedDate}
                </p>
                <p>
                  <strong>時間:</strong> {selectedSlot?.time || "-"}（{selectedSlot?.durationMinutes || "-"}分）
                </p>
                <p>
                  <strong>講師:</strong> {selectedSlot?.instructorName || "調整"}
                </p>
              </div>
              <label className={styles.label} style={{ marginTop: "0.75rem" }}>
                レッスン形式
                <div className={v2.optionRow}>
                  {[
                    { id: "in_person", label: "対面" },
                    { id: "online", label: "オンライン" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${v2.optionChip} ${form.lessonDeliveryType === opt.id ? v2.optionChipSelected : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, lessonDeliveryType: opt.id }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </label>
              <label className={styles.label}>
                伝えたいこと（任意）
                <input
                  className={styles.field}
                  value={form.memo}
                  onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                  placeholder="教室への連絡事項"
                />
              </label>
            </section>
          ) : null}

          {wizardStep === 4 ? (
            <section className={v2.successCard}>
              <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
                申し込みを受け付けました
              </h2>
              <p className={styles.description}>予約一覧で状態をご確認ください。確定までお待ちください。</p>
              <button className={styles.button} type="button" onClick={() => setMainTab("list")}>
                予約一覧へ
              </button>
              <button className={styles.button} type="button" style={{ marginTop: 8 }} onClick={resetWizard}>
                続けて予約する
              </button>
            </section>
          ) : null}

          {confirmOpen ? (
            <div className={v2.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
              <div className={v2.modalCard}>
                <h3 id="confirm-title" className={styles.sectionTitle} style={{ marginTop: 0 }}>
                  予約を申し込みますか？
                </h3>
                <p className={styles.description}>
                  {selectedDate} {selectedSlot?.time} / {lessonDeliveryLabel(form.lessonDeliveryType)}
                </p>
                <div className={v2.modalActions}>
                  <button type="button" className={v2.modalBtn} onClick={() => setConfirmOpen(false)} disabled={saving}>
                    戻る
                  </button>
                  <button type="button" className={`${v2.modalBtn} ${v2.modalBtnPrimary}`} onClick={submitReservation} disabled={saving}>
                    {saving ? "送信中..." : "申し込む"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {wizardStep >= 1 && wizardStep <= 3 ? (
            <div className={v2.bottomBar}>
              <div className={v2.bottomBarInner}>
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    className={v2.bottomBtn}
                    onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                  >
                    戻る
                  </button>
                ) : (
                  <span />
                )}
                {wizardStep === 1 ? (
                  <button
                    type="button"
                    className={`${v2.bottomBtn} ${v2.bottomBtnPrimary}`}
                    disabled={!canNextFromStep1}
                    onClick={() => setWizardStep(2)}
                  >
                    次へ
                  </button>
                ) : null}
                {wizardStep === 2 ? (
                  <button
                    type="button"
                    className={`${v2.bottomBtn} ${v2.bottomBtnPrimary}`}
                    disabled={!canNextFromStep2}
                    onClick={() => setWizardStep(3)}
                  >
                    次へ
                  </button>
                ) : null}
                {wizardStep === 3 ? (
                  <button
                    type="button"
                    className={`${v2.bottomBtn} ${v2.bottomBtnPrimary}`}
                    disabled={!canNextFromStep3 || bookableSlots.length === 0}
                    onClick={() => setConfirmOpen(true)}
                  >
                    内容を確認
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {mainTab === "list" ? (
        <section>
          <label className={styles.label}>
            状態
            <select
              className={styles.field}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">すべて</option>
              <option value="requested">予約申請中</option>
              <option value="confirmed">予約確定</option>
              <option value="change_requested">変更依頼</option>
              <option value="rejected">却下</option>
              <option value="cancelled">キャンセル</option>
              <option value="completed">完了</option>
            </select>
          </label>
          {reservations.map((item) => renderReservationCard(item))}
          {!loading && reservations.length === 0 ? <p className={styles.description}>予約がありません。</p> : null}
        </section>
      ) : null}

      {mainTab === "manage" ? (
        <section>
          <p className={styles.description}>変更・キャンセルが必要な予約から操作できます。</p>
          {manageReservations.map((item) => renderReservationCard(item, { compactActions: true }))}
          {!loading && manageReservations.length === 0 ? (
            <p className={styles.description}>対象の予約はありません。</p>
          ) : null}
        </section>
      ) : null}

      <p className={v2.rollbackHint}>
        画面が不安定な場合は{" "}
        <Link href="/student/reservations?ui=v1" prefetch={false}>
          従来の予約画面
        </Link>
        に切り替えられます。
      </p>
    </div>
  );
}

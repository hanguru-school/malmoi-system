"use client";

/**
 * 学生予約 V2：時間中心・段階型（エンジン: /api/student/reservation-candidates 共有）
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../../../app/login/login.module.css";
import v2 from "./reservations-app.module.css";
import flow from "./student-reservation-flow.module.css";
import {
  buildStudentReservationCreatePayload,
  fetchStudentLessonTypes,
  fetchStudentReservationCandidates,
  fetchStudentReservations,
  patchStudentReservation,
  postStudentReservation,
  postStudentReservationCancel,
} from "../../adapters/studentReservationsAdapter";
import { addDays, formatDateKey, parseDateKey, startOfDay } from "../../../../lib/adapters/studentReservationView";
import { studentFacingUnavailableHint } from "../../../../lib/student/studentReservationReasonStudentJa";
import StudentReservationSummary from "./StudentReservationSummary";
import LessonTypeCard from "./LessonTypeCard";
import StudentReservationCalendar from "./StudentReservationCalendar";
import StudentTimeCandidateList from "./StudentTimeCandidateList";
import StudentReservationConfirmCard from "./StudentReservationConfirmCard";
import StudentReservationDetailModal from "./StudentReservationDetailModal";
import ClassroomWeekHoursPortalStrip from "../shared/ClassroomWeekHoursPortalStrip";
import { lessonDeliveryLabel, statusMeta } from "../../../../lib/adapters/studentReservationView";

const STEPS = ["レッスン", "日付", "時間", "確認", "完了"];

function deliveryLabelShort(id) {
  return id === "online" ? "オンライン" : "対面";
}

function badgeToneClass(tone) {
  if (tone === "pending") return flow.badgePending;
  if (tone === "confirmed") return flow.badgeConfirmed;
  if (tone === "cancelled") return flow.badgeCancelled;
  if (tone === "completed") return flow.badgeCompleted;
  return flow.badgePending;
}

export default function StudentReservationsApp() {
  const [mainTab, setMainTab] = useState("reserve");
  const [step, setStep] = useState(1);

  const [lessonTypes, setLessonTypes] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonDeliveryType, setLessonDeliveryType] = useState("in_person");

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [error, setError] = useState("");

  const [lessonUsage, setLessonUsage] = useState(null);
  const [monthPayload, setMonthPayload] = useState(null);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [form, setForm] = useState({ memo: "" });
  const [saving, setSaving] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReservation, setDetailReservation] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, 365), [today]);

  const remainingMinutes = lessonUsage?.lessonMinutes?.remainingMinutes ?? null;
  const snapRemaining = monthPayload?.studentSnapshot?.remainingMinutes ?? null;
  const bookableMinutes = snapRemaining != null ? snapRemaining : remainingMinutes;

  const nextReservationLabel = useMemo(() => {
    const rows = [...(reservations || [])].filter((r) => !["cancelled", "rejected"].includes(String(r.status || "")));
    const todayKey = formatDateKey(today);
    rows.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    const upcoming = rows.find((r) => `${r.date}`.slice(0, 10) >= todayKey);
    if (!upcoming) return "";
    return `${upcoming.date} ${String(upcoming.time || "").slice(0, 5)}（${upcoming.lessonServiceNameJa || "レッスン"}）`;
  }, [reservations, today]);

  const useMinutes = selectedLesson?.durationMinutes ?? null;
  const afterMinutes = useMemo(() => {
    if (selectedCandidate?.remainingMinutesAfterBooking != null) return selectedCandidate.remainingMinutesAfterBooking;
    if (useMinutes != null && remainingMinutes != null) return Math.max(0, remainingMinutes - useMinutes);
    return null;
  }, [selectedCandidate, useMinutes, remainingMinutes]);

  const monthRange = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    return { fromDate: formatDateKey(first), toDate: formatDateKey(last) };
  }, [calendarMonth]);

  const loadReservations = useCallback(async () => {
    const data = await fetchStudentReservations({});
    setReservations(data.reservations || []);
  }, []);

  const loadLessonTypes = useCallback(async () => {
    const data = await fetchStudentLessonTypes();
    setLessonTypes(data.lessonTypes || []);
  }, []);

  const loadMonthCandidates = useCallback(async () => {
    if (!selectedLesson?.id) return;
    setMonthLoading(true);
    setError("");
    try {
      const data = await fetchStudentReservationCandidates({
        lessonTypeId: selectedLesson.id,
        fromDate: monthRange.fromDate,
        toDate: monthRange.toDate,
        lessonMode: lessonDeliveryType,
      });
      setMonthPayload(data);
    } catch (e) {
      setError(e.message || "候補の取得に失敗しました。");
      setMonthPayload(null);
    } finally {
      setMonthLoading(false);
    }
  }, [selectedLesson?.id, monthRange.fromDate, monthRange.toDate, lessonDeliveryType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadReservations(), loadLessonTypes()]);
      } catch (e) {
        if (!cancelled) setError(e.message || "読み込みに失敗しました。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadReservations, loadLessonTypes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/student/lesson-minutes", { credentials: "include" });
        const data = await res.json();
        if (!cancelled && data?.ok && data.usage) setLessonUsage(data.usage);
      } catch {
        if (!cancelled) setLessonUsage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (step >= 2 && selectedLesson?.id) loadMonthCandidates();
  }, [step, selectedLesson?.id, loadMonthCandidates]);

  const getDayMeta = useCallback(
    (dateKey) => {
      const outOfMonth =
        dateKey < monthRange.fromDate ||
        dateKey > monthRange.toDate ||
        parseDateKey(dateKey) < today ||
        parseDateKey(dateKey) > maxDate;
      if (outOfMonth) return { disabled: true, bookable: false, hasSlots: false, hint: "" };

      const ds = (monthPayload?.daySummaries || []).find((x) => x.targetDate === dateKey);
      if (ds?.daySummary?.closed) {
        return {
          disabled: true,
          bookable: false,
          hasSlots: false,
          hint: "休業",
        };
      }

      const dayCands = (monthPayload?.candidates || []).filter((c) => c.date === dateKey);
      if (dayCands.length === 0) {
        return { disabled: true, bookable: false, hasSlots: false, hint: "枠なし" };
      }
      const ok = dayCands.some((c) => c.bookingOk);
      if (ok) return { disabled: false, bookable: true, hasSlots: true, hint: "" };
      const first = dayCands[0];
      const hint = studentFacingUnavailableHint(first.reasonCodes, first.blockReasonsJa);
      return { disabled: true, bookable: false, hasSlots: true, hint };
    },
    [monthPayload, monthRange.fromDate, monthRange.toDate, today, maxDate]
  );

  const candidatesForSelectedDate = useMemo(() => {
    if (!selectedDate || !monthPayload?.candidates) return [];
    return [...monthPayload.candidates]
      .filter((c) => c.date === selectedDate)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }, [monthPayload, selectedDate]);

  const candidateDiagnostics = useMemo(() => {
    const summary = monthPayload?.summary || monthPayload?.diagnostics?.studentSummary || null;
    const adminSummary = monthPayload?.diagnostics?.adminSummary || null;
    return { summary, adminSummary };
  }, [monthPayload]);

  useEffect(() => {
    if (selectedDate && selectedCandidate && selectedCandidate.date !== selectedDate) {
      setSelectedCandidate(null);
    }
  }, [selectedDate, selectedCandidate]);

  useEffect(() => {
    if (step !== 2 || !monthPayload || monthLoading) return;
    if (selectedDate) {
      const m = getDayMeta(selectedDate);
      if (m.bookable) return;
    }
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    for (let day = 1; day <= end.getDate(); day += 1) {
      const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const key = formatDateKey(current);
      if (getDayMeta(key).bookable) {
        setSelectedDate(key);
        return;
      }
    }
    setSelectedDate("");
  }, [step, monthPayload, monthLoading, calendarMonth, selectedDate, getDayMeta]);

  function resetFlow() {
    setStep(1);
    setSelectedLesson(null);
    setSelectedDate("");
    setSelectedCandidate(null);
    setForm({ memo: "" });
    setMonthPayload(null);
  }

  async function submitReservation() {
    if (!selectedCandidate?.slotId) return;
    setSaving(true);
    setError("");
    try {
      const payload = buildStudentReservationCreatePayload({
        slotId: selectedCandidate.slotId,
        lessonDeliveryType,
        memo: form.memo,
      });
      await postStudentReservation(payload);
      setStep(5);
      await loadReservations();
      const res = await fetch("/api/student/lesson-minutes", { credentials: "include" });
      const data = await res.json();
      if (data?.ok && data.usage) setLessonUsage(data.usage);
      await loadMonthCandidates();
    } catch (e) {
      setError(e.message || "予約に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id) {
    setCancelBusy(true);
    setError("");
    try {
      await postStudentReservationCancel(id);
      setDetailOpen(false);
      await loadReservations();
    } catch (e) {
      setError(e.message || "キャンセルに失敗しました。");
    } finally {
      setCancelBusy(false);
    }
  }

  async function handleReschedule(id, slotId) {
    if (!slotId) return;
    setRescheduleBusy(true);
    setError("");
    try {
      await patchStudentReservation(id, { slotId });
      setDetailOpen(false);
      await loadReservations();
    } catch (e) {
      setError(e.message || "変更に失敗しました。");
    } finally {
      setRescheduleBusy(false);
    }
  }

  const canNext =
    (step === 1 && selectedLesson) ||
    (step === 2 && selectedDate && getDayMeta(selectedDate).bookable) ||
    (step === 3 && selectedCandidate?.bookingOk) ||
    step === 4;

  function goNext() {
    if (step < 4) setStep((s) => s + 1);
    else if (step === 4) submitReservation();
  }

  function goBack() {
    if (step > 1) setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className={flow.flowRoot}>
      <div className={v2.tabBar} role="tablist" aria-label="予約メニュー">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "reserve"}
          className={`${v2.tab} ${mainTab === "reserve" ? v2.tabActive : ""}`}
          onClick={() => {
            setMainTab("reserve");
            if (step === 5) resetFlow();
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
      </div>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {loading ? <p className={styles.description}>読み込み中...</p> : null}

      {mainTab === "reserve" ? (
        <>
          <StudentReservationSummary
            remainingMinutes={remainingMinutes}
            bookableMinutes={bookableMinutes}
            nextReservationLabel={nextReservationLabel}
            useMinutes={useMinutes}
            afterMinutes={selectedLesson && (selectedCandidate || step >= 3) ? afterMinutes : null}
            loading={loading}
          />

          <ClassroomWeekHoursPortalStrip />

          {step < 5 ? (
            <div className={flow.pcLayout}>
              <div>
                <div className={flow.deliveryRow} role="group" aria-label="レッスン形式">
                  {[
                    { id: "in_person", label: "対面" },
                    { id: "online", label: "オンライン" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${flow.deliveryChip} ${lessonDeliveryType === opt.id ? flow.deliveryChipOn : ""}`}
                      onClick={() => {
                        setLessonDeliveryType(opt.id);
                        setSelectedDate("");
                        setSelectedCandidate(null);
                        if (selectedLesson) setStep(2);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className={flow.stepHeader}>
                  <h2 className={flow.stepTitle}>
                    STEP {step} / {STEPS[step - 1]}
                  </h2>
                  <div className={flow.stepTrack} aria-hidden>
                    {STEPS.slice(0, 4).map((lab, i) => (
                      <span
                        key={lab}
                        className={`${flow.stepPill} ${step === i + 1 ? flow.stepPillOn : ""} ${
                          step > i + 1 ? flow.stepPillDone : ""
                        }`}
                      >
                        {i + 1}. {lab}
                      </span>
                    ))}
                  </div>
                </div>

                {monthLoading && step >= 2 ? <p className={flow.hint}>日程を読み込み中…</p> : null}

                {step === 1 ? (
                  <section>
                    <p className={flow.hint}>予約したいレッスンを選んでください（所要時間が決まります）。</p>
                    <div className={flow.lessonGrid}>
                      {lessonTypes.map((lt) => (
                        <LessonTypeCard
                          key={lt.id}
                          lesson={lt}
                          selected={selectedLesson?.id === lt.id}
                          deliveryLabel={deliveryLabelShort(lessonDeliveryType)}
                          onSelect={(l) => {
                            setSelectedLesson(l);
                            setSelectedDate("");
                            setSelectedCandidate(null);
                          }}
                        />
                      ))}
                    </div>
                    {!lessonTypes.length && !loading ? (
                      <p className={flow.hint}>現在、学生から選べるレッスンがありません。教室にお問い合わせください。</p>
                    ) : null}
                  </section>
                ) : null}

                {step === 2 ? (
                  <section>
                    <p className={flow.hint}>予約する日付を選んでください。グレー表示の日は選べません。</p>
                    {candidateDiagnostics.summary &&
                    candidateDiagnostics.summary.total > 0 &&
                    candidateDiagnostics.summary.bookingOk === 0 ? (
                      <div className={flow.impactBox} style={{ marginBottom: "0.8rem" }}>
                        <div className={flow.impactTitle}>현재 조건에서는 예약 가능한 시간이 없습니다</div>
                        <div className={flow.impactLine}>
                          후보 {candidateDiagnostics.summary.total}개 중 예약 가능 0개
                        </div>
                        <div className={flow.hint} style={{ marginTop: "0.35rem" }}>
                          주요 사유:
                          {(candidateDiagnostics.summary.topReasonCodes || [])
                            .slice(0, 3)
                            .map((x) => `${x.code}(${x.count})`)
                            .join(", ") || " 정보 없음"}
                        </div>
                        {candidateDiagnostics.adminSummary ? (
                          <div className={flow.hint} style={{ marginTop: "0.25rem" }}>
                            관리자 기준 비교: 예약 가능 {candidateDiagnostics.adminSummary.bookingOk || 0} /{" "}
                            {candidateDiagnostics.adminSummary.total || 0}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <StudentReservationCalendar
                      calendarMonth={calendarMonth}
                      today={today}
                      maxDate={maxDate}
                      selectedDate={selectedDate}
                      onSelectDate={(k) => {
                        setSelectedDate(k);
                        setSelectedCandidate(null);
                      }}
                      onPrevMonth={() =>
                        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                      }
                      onNextMonth={() =>
                        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                      }
                      getDayMeta={getDayMeta}
                    />
                  </section>
                ) : null}

                {step === 3 ? (
                  <section>
                    <p className={flow.hint}>
                      {selectedDate} の開始時間を選んでください（タップで選択）。
                    </p>
                    <StudentTimeCandidateList
                      candidates={candidatesForSelectedDate}
                      selectedSlotId={selectedCandidate?.slotId || ""}
                      onSelect={(c) => setSelectedCandidate(c)}
                    />
                  </section>
                ) : null}

                {step === 4 ? (
                  <section>
                    <p className={flow.hint}>内容を確認して、問題なければ予約を確定してください。</p>
                    <StudentReservationConfirmCard
                      lessonName={selectedLesson?.displayName}
                      date={selectedDate}
                      startTime={selectedCandidate?.startTime}
                      endTime={selectedCandidate?.endTime}
                      teacherName={selectedCandidate?.teacherName}
                      durationMinutes={selectedLesson?.durationMinutes}
                      useMinutes={useMinutes}
                      afterMinutes={afterMinutes}
                      deliveryType={lessonDeliveryType}
                      memo={form.memo}
                      onMemoChange={(v) => setForm((p) => ({ ...p, memo: v }))}
                    />
                  </section>
                ) : null}
              </div>

              {step === 4 ? (
                <aside className={flow.pcSticky}>
                  <div className={flow.impactBox}>
                    <div className={flow.impactTitle}>予約ボタンの前にご確認</div>
                    <div className={flow.impactLine}>今回使う時間: {useMinutes != null ? `${useMinutes}分` : "—"}</div>
                    <div className={flow.impactLine} style={{ marginTop: "0.35rem" }}>
                      予約後の残り: {afterMinutes != null ? `${afterMinutes}分` : "—"}
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          ) : (
            <section className={v2.successCard}>
              <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
                予約を受け付けました
              </h2>
              <p className={styles.description}>予約一覧で状態をご確認ください。変更・キャンセルが可能な場合は一覧から操作できます。</p>
              <button className={styles.button} type="button" onClick={() => setMainTab("list")}>
                予約一覧へ
              </button>
              <button className={styles.button} type="button" style={{ marginTop: 8 }} onClick={resetFlow}>
                続けて予約する
              </button>
            </section>
          )}

          {step >= 1 && step <= 4 ? (
            <div className={flow.bottomBar}>
              <div className={flow.bottomInner}>
                <button type="button" className={flow.bottomBtn} onClick={goBack} disabled={step === 1 || saving}>
                  戻る
                </button>
                <button
                  type="button"
                  className={`${flow.bottomBtn} ${flow.bottomPrimary}`}
                  disabled={!canNext || saving || (step === 2 && monthLoading)}
                  onClick={goNext}
                >
                  {step === 4 ? (saving ? "送信中…" : "予約を確定する") : "次へ"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {mainTab === "list" ? (
        <section>
          <p className={flow.hint}>行をタップすると詳細・変更・キャンセルができます。</p>
          {reservations.map((item) => {
            const st = statusMeta(item.status, item.attendanceStatus);
            return (
              <button
                key={item.id}
                type="button"
                className={flow.listCard}
                onClick={() => {
                  setDetailReservation(item);
                  setDetailOpen(true);
                }}
              >
                <div className={flow.listCardHead}>
                  <div>
                    <strong>
                      {item.date} {String(item.time || "").slice(0, 5)}
                    </strong>
                    <p className={flow.hint} style={{ margin: "0.25rem 0 0" }}>
                      {item.lessonServiceNameJa || "レッスン"} · {lessonDeliveryLabel(item.lessonDeliveryType)}
                    </p>
                    <p className={flow.hint} style={{ margin: "0.15rem 0 0" }}>
                      担当: {item.instructorName || "—"}
                    </p>
                  </div>
                  <span className={`${flow.badge} ${badgeToneClass(st.tone)}`}>{st.label}</span>
                </div>
              </button>
            );
          })}
          {!loading && reservations.length === 0 ? <p className={styles.description}>予約がありません。</p> : null}
        </section>
      ) : null}

      <StudentReservationDetailModal
        open={detailOpen}
        reservation={detailReservation}
        onClose={() => setDetailOpen(false)}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
        cancelBusy={cancelBusy}
        rescheduleBusy={rescheduleBusy}
      />

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

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  blockedText,
  formatDateKey,
  lessonDeliveryLabel,
  startOfDay,
} from "../../../../lib/adapters/studentReservationView";
import { fetchStudentReservationCandidates } from "../../../../lib/adapters/studentReservationClient";
import StudentReservationStatusBadge from "./StudentReservationStatusBadge";
import StudentTimeCandidateList from "./StudentTimeCandidateList";
import flow from "./student-reservation-flow.module.css";

export default function StudentReservationDetailModal({
  open,
  reservation,
  onClose,
  onCancel,
  onReschedule,
  cancelBusy,
  rescheduleBusy,
}) {
  const [candidates, setCandidates] = useState([]);
  const [pick, setPick] = useState(null);
  const [loadErr, setLoadErr] = useState("");

  const self = reservation?.selfService || {};
  const lessonId = String(reservation?.lessonServiceId || "").trim();

  useEffect(() => {
    if (!open || !reservation || !lessonId) {
      setCandidates([]);
      setPick(null);
      setLoadErr("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadErr("");
      try {
        const base = startOfDay(new Date());
        const fromDate = formatDateKey(base);
        const toDate = formatDateKey(addDays(base, 56));
        const data = await fetchStudentReservationCandidates({
          lessonTypeId: lessonId,
          fromDate,
          toDate,
          lessonMode: reservation.lessonDeliveryType || "in_person",
        });
        if (cancelled) return;
        const rows = (data.candidates || []).filter(
          (c) => c.bookingOk && String(c.slotId) !== String(reservation.slotId)
        );
        setCandidates(rows.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)));
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e.message || "候補の読み込みに失敗しました。");
          setCandidates([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reservation, lessonId]);

  const canChange = Boolean(self.canStudentChange);
  const canCancel = Boolean(self.canStudentCancel);

  const blockHint = useMemo(() => {
    if (!self.blockedReasonChange && !self.blockedReasonCancel) return "";
    return blockedText(self.blockedReasonChange || self.blockedReasonCancel);
  }, [self.blockedReasonChange, self.blockedReasonCancel]);

  if (!open || !reservation) return null;

  return (
    <div className={flow.modalRoot} role="dialog" aria-modal="true" aria-label="予約の詳細">
      <button type="button" className={flow.modalBackdrop} aria-label="閉じる" onClick={onClose} />
      <div className={flow.modalCard}>
        <button type="button" className={flow.modalClose} aria-label="閉じる" onClick={onClose}>
          ×
        </button>
        <h3 className={flow.modalTitle}>{reservation.studentNameKanji || "ご予約"}</h3>
        <StudentReservationStatusBadge status={reservation.status} attendanceStatus={reservation.attendanceStatus} />
        <p className={flow.hint} style={{ marginTop: "0.5rem" }}>
          <strong>
            {reservation.date} {String(reservation.time || "").slice(0, 5)}
          </strong>
          <br />
          {reservation.lessonServiceNameJa || "レッスン"} · {lessonDeliveryLabel(reservation.lessonDeliveryType)}
          <br />
          担当: {reservation.instructorName || "—"}
        </p>
        <p className={flow.hint}>
          変更: {canChange ? "可" : "不可"} / キャンセル: {canCancel ? "可" : "不可"}
          {blockHint ? ` — ${blockHint}` : ""}
        </p>
        {reservation.expectedPointsConsume != null ? (
          <p className={flow.hint} style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
            ポイント目安: {reservation.expectedPointsConsume}pt（詳細は
            <Link href="/student/lesson-time">レッスン時間・利用</Link>
            でもご確認ください）
          </p>
        ) : null}

        {canChange && lessonId ? (
          <div style={{ marginTop: "0.75rem" }}>
            <p className={flow.hint} style={{ fontWeight: 700, color: "#334155" }}>
              変更先の時間を選ぶ
            </p>
            {loadErr ? <p className={flow.hint}>{loadErr}</p> : null}
            <StudentTimeCandidateList
              candidates={candidates.slice(0, 24)}
              selectedSlotId={pick?.slotId || ""}
              onSelect={(c) => setPick(c)}
            />
            <button
              type="button"
              className={`${flow.modalBtn} ${flow.modalBtnPrimary}`}
              style={{ marginTop: "0.5rem", width: "100%" }}
              disabled={!pick || rescheduleBusy}
              onClick={() => onReschedule(reservation.id, pick.slotId)}
            >
              {rescheduleBusy ? "変更中…" : "変更する"}
            </button>
          </div>
        ) : null}

        <div className={flow.modalActions}>
          {canCancel ? (
            <button
              type="button"
              className={`${flow.modalBtn} ${flow.modalBtnDanger}`}
              disabled={cancelBusy}
              onClick={() => onCancel(reservation.id)}
            >
              {cancelBusy ? "処理中…" : "キャンセルする"}
            </button>
          ) : null}
          <Link href="/student/lesson-time" className={flow.modalBtn} style={{ textAlign: "center", lineHeight: 2.4 }}>
            詳細を見る（時間・利用）
          </Link>
          <button type="button" className={flow.modalBtn} onClick={onClose}>
            閉じる
          </button>
        </div>
        {canCancel ? (
          <p className={flow.hint} style={{ marginTop: "0.5rem" }}>
            キャンセル規定に基づき処理されます。教室からの確認が必要な場合があります。
          </p>
        ) : null}
      </div>
    </div>
  );
}

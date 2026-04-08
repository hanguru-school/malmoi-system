"use client";

import { studentFacingUnavailableHint } from "../../../../lib/student/studentReservationReasonStudentJa";
import flow from "./student-reservation-flow.module.css";

export default function StudentTimeCandidateList({ candidates = [], selectedSlotId, onSelect }) {
  if (!candidates.length) {
    return <p className={flow.hint}>この日は予約できる時間がありません。</p>;
  }
  return (
    <div className={flow.timeGrid}>
      {candidates.map((c) => {
        const ok = Boolean(c.bookingOk);
        const hint = ok ? "" : studentFacingUnavailableHint(c.reasonCodes, c.blockReasonsJa);
        return (
          <button
            key={c.slotId}
            type="button"
            disabled={!ok}
            title={hint || undefined}
            className={`${flow.timeBtn} ${selectedSlotId === c.slotId ? flow.timeBtnSel : ""}`}
            onClick={() => {
              if (ok) onSelect(c);
            }}
          >
            {c.startTime}
            <span className={flow.timeSub}>
              {c.endTime ? `〜${c.endTime}` : ""}
              {c.teacherName ? ` · ${c.teacherName}` : ""}
              {c.availableCount != null && c.capacity != null ? ` · 残${c.availableCount}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

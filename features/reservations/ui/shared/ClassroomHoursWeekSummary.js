"use client";

/**
 * 学生・講師ポータル向け: classroomOperations を渡して週次ピルを表示（管理者ビジュアルと同系）
 */

import { useMemo } from "react";
import { fromClassroomOperations } from "../../../../lib/reservations/classroomHoursUIModel.js";
import { WEEKDAY_LABEL_JA, WEEKDAY_ORDER_TOKYO } from "../../../../lib/reservations/scheduleVisualShared.js";
import s from "../../../../app/admin/settings/classroom/classroom-hours-visual-panel.module.css";

function ruleForWd(model, wd) {
  const w = model.weekdays[String(wd)];
  if (w?.closed) return { closed: true, open: model.open, close: model.close };
  return {
    closed: false,
    open: w?.open || model.open,
    close: w?.close || model.close,
  };
}

export default function ClassroomHoursWeekSummary({ classroomOperations = {}, schoolBasic = {} }) {
  const model = useMemo(() => fromClassroomOperations(classroomOperations, schoolBasic), [classroomOperations, schoolBasic]);
  return (
    <div className={s.summaryStrip} aria-label="週次営業時間">
      {WEEKDAY_ORDER_TOKYO.map((wd) => {
        const r = ruleForWd(model, wd);
        const text = r.closed ? "休業" : `${r.open}〜${r.close}`;
        return (
          <span key={wd} className={`${s.summaryPill} ${r.closed ? s.summaryPillOff : ""}`}>
            <span className={s.summaryWd}>{WEEKDAY_LABEL_JA[wd]}</span>
            <span>{text}</span>
          </span>
        );
      })}
    </div>
  );
}

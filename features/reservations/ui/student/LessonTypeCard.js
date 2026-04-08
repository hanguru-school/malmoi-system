"use client";

import flow from "./student-reservation-flow.module.css";

function modeLabel(lessonMode) {
  const m = String(lessonMode || "").trim();
  if (m === "group") return "グループ";
  if (m === "pair") return "ペア";
  return "1対1";
}

export default function LessonTypeCard({ lesson, selected, deliveryLabel, onSelect }) {
  return (
    <button
      type="button"
      className={`${flow.lessonCard} ${selected ? flow.lessonCardOn : ""}`}
      onClick={() => onSelect(lesson)}
    >
      <div className={flow.lessonName}>{lesson.displayName || "レッスン"}</div>
      <div className={flow.lessonMeta}>
        {lesson.durationMinutes}分 · {deliveryLabel} · {modeLabel(lesson.lessonMode)}
      </div>
    </button>
  );
}

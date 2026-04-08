"use client";

import flow from "./student-reservation-flow.module.css";

export default function StudentReservationCalendar({
  calendarMonth,
  today,
  maxDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  getDayMeta,
}) {
  const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const leading = start.getDay();
  const cells = [];
  for (let i = 0; i < leading; i += 1) {
    cells.push({ key: `b-${i}`, blank: true });
  }
  for (let day = 1; day <= end.getDate(); day += 1) {
    const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    cells.push({ key: dateKey, blank: false, dateKey, label: String(day), current });
  }

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const canPrev = monthStart > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0) < maxDate;

  return (
    <div>
      <div className={flow.calHeader}>
        <button type="button" className={flow.calNav} onClick={onPrevMonth} disabled={!canPrev}>
          前月
        </button>
        <strong>
          {calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月
        </strong>
        <button type="button" className={flow.calNav} onClick={onNextMonth} disabled={!canNext}>
          翌月
        </button>
      </div>
      <div className={flow.calWeekdays}>
        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className={flow.calGrid}>
        {cells.map((cell) => {
          if (cell.blank) return <span key={cell.key} className={flow.calBlank} />;
          const outOfRange = cell.current < today || cell.current > maxDate;
          const meta = getDayMeta(cell.dateKey);
          const disabled = outOfRange || meta.disabled;
          let cls = flow.calDay;
          if (!disabled) {
            if (meta.bookable) cls += ` ${flow.calDayOk}`;
            else if (meta.hasSlots) cls += ` ${flow.calDayWeak}`;
          }
          if (selectedDate === cell.dateKey) cls += ` ${flow.calDaySel}`;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled}
              className={cls}
              title={meta.hint || ""}
              onClick={() => {
                if (!disabled) onSelectDate(cell.dateKey);
              }}
            >
              {cell.label}
              {meta.hint && !disabled && meta.bookable === false ? (
                <span className={flow.dayHint}>{meta.hint}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

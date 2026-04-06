"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./student.module.css";
import { studentReservationStatusLabel, studentReservationStatusTone } from "./dashboardReservationStatus";

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD の日付キーでグループ化 */
function groupReservationsByDate(reservations) {
  const map = new Map();
  for (const r of reservations || []) {
    const d = String(r?.date || "").trim();
    if (!d) continue;
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(r);
  }
  return map;
}

function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

export default function StudentReservationMiniCalendar({ reservations = [], reservationsHref = "/student/reservations" }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });

  const byDate = useMemo(() => groupReservationsByDate(reservations), [reservations]);

  const year = cursor.y;
  const monthIndex = cursor.m;
  const grid = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);

  const title = `${year}年${monthIndex + 1}月`;

  function goPrev() {
    setCursor((c) => {
      const nm = c.m - 1;
      if (nm < 0) return { y: c.y - 1, m: 11 };
      return { y: c.y, m: nm };
    });
  }

  function goNext() {
    setCursor((c) => {
      const nm = c.m + 1;
      if (nm > 11) return { y: c.y + 1, m: 0 };
      return { y: c.y, m: nm };
    });
  }

  const today = new Date();
  const isToday = (day) =>
    day != null && today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day;

  const upcomingInMonth = useMemo(() => {
    const list = (reservations || []).filter((r) => String(r?.date || "").trim());
    const prefix = `${year}-${pad2(monthIndex + 1)}`;
    return list
      .filter((r) => String(r.date).startsWith(prefix))
      .sort((a, b) => {
        const ka = `${a.date}T${a.time || "00:00"}`;
        const kb = `${b.date}T${b.time || "00:00"}`;
        return ka.localeCompare(kb);
      })
      .slice(0, 8);
  }, [reservations, year, monthIndex]);

  return (
    <div className={styles.dashboardCalendar}>
      <div className={styles.dashboardCalendarHeader}>
        <button type="button" className={styles.dashboardCalendarNav} onClick={goPrev} aria-label="前の月">
          ‹
        </button>
        <p className={styles.dashboardCalendarTitle}>{title}</p>
        <button type="button" className={styles.dashboardCalendarNav} onClick={goNext} aria-label="次の月">
          ›
        </button>
      </div>
      <div className={styles.dashboardCalendarWeekRow}>
        {WEEKDAYS_JA.map((w) => (
          <span key={w} className={styles.dashboardCalendarWeekday}>
            {w}
          </span>
        ))}
      </div>
      <div className={styles.dashboardCalendarGrid}>
        {grid.map((day, idx) => {
          if (day == null) {
            return <div key={`e-${idx}`} className={styles.dashboardCalendarCellEmpty} />;
          }
          const key = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
          const dayItems = byDate.get(key) || [];
          const has = dayItems.length > 0;
          return (
            <div
              key={key}
              className={`${styles.dashboardCalendarCell} ${isToday(day) ? styles.dashboardCalendarCellToday : ""} ${has ? styles.dashboardCalendarCellHas : ""}`}
            >
              <span className={styles.dashboardCalendarDayNum}>{day}</span>
              {has ? <span className={styles.dashboardCalendarDot} aria-hidden /> : null}
            </div>
          );
        })}
      </div>

      <div className={styles.dashboardCalendarList}>
        <p className={styles.dashboardCalendarListTitle}>この月の予定</p>
        {upcomingInMonth.length === 0 ? (
          <p className={styles.dashboardCalendarEmpty}>この月に表示できる予約はありません。</p>
        ) : (
          <ul className={styles.dashboardCalendarUl}>
            {upcomingInMonth.map((r) => (
              <li key={r.id} className={styles.dashboardCalendarLi}>
                <div className={styles.dashboardCalendarLiMain}>
                  <span className={styles.dashboardCalendarLiWhen}>
                    {r.date} {r.time || ""}
                  </span>
                  <span className={styles.dashboardCalendarLiMeta}>
                    {r.durationMinutes ?? "—"}分 · {r.instructorName || "講師未定"}
                  </span>
                </div>
                <span
                  className={styles.dashboardCalendarLiBadge}
                  data-status={studentReservationStatusTone(r.status)}
                >
                  {studentReservationStatusLabel(r.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link className={styles.dashboardCalendarLink} href={reservationsHref}>
          すべての予約を見る
        </Link>
      </div>
    </div>
  );
}

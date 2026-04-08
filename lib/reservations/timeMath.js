/** @param {string} time "HH:MM" */
export function timeToMinutes(time) {
  const [hh, mm] = String(time || "00:00")
    .split(":")
    .map((v) => Number(v || 0));
  return hh * 60 + mm;
}

export function minutesToClock(minutes) {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Number(minutes || 0)));
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function normalizeClockFragment(raw, fallback = "10:00") {
  const s = String(raw || "").trim();
  if (!/^\d{2}:\d{2}$/.test(s)) return fallback;
  const [hh, mm] = s.split(":").map((v) => Number(v || 0));
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return fallback;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** @returns {number} 0=日曜 … 6=土曜（Asia/Tokyo・その暦日） */
export function tokyoWeekdayIndex(dateYmd) {
  const d = new Date(`${String(dateYmd).slice(0, 10)}T15:00:00+09:00`);
  return d.getUTCDay();
}

export function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function lessonOverlapsBreak(lessonStartMin, lessonEndMin, breaks) {
  if (!Array.isArray(breaks)) return false;
  for (const b of breaks) {
    const bs = timeToMinutes(b?.start);
    const be = timeToMinutes(b?.end);
    if (intervalsOverlap(lessonStartMin, lessonEndMin, bs, be)) return true;
  }
  return false;
}

export function lessonInsideWorkWindow(lessonStartMin, lessonEndMin, windows) {
  if (!Array.isArray(windows) || windows.length === 0) return false;
  return windows.some((w) => lessonStartMin >= w.startMin && lessonEndMin <= w.endMin);
}

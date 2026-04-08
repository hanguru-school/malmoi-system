import {
  lessonInsideWorkWindow,
  lessonOverlapsBreak,
  normalizeClockFragment,
  timeToMinutes,
  tokyoWeekdayIndex,
} from "./timeMath.js";

/**
 * 教室運営設定から「その日の稼働区間」と休憩を解決する（純粋関数）
 * @param {object} classroomOperations systemSettings.classroomOperations
 * @param {string} dateYmd YYYY-MM-DD
 */
export function getClassroomDaySchedule(classroomOperations, dateYmd) {
  const co = classroomOperations || {};
  const defOpen = normalizeClockFragment(co.defaultOpen || "10:00");
  const defClose = normalizeClockFragment(co.defaultClose || "19:00");
  const defaultBreaks = Array.isArray(co.defaultBreaks) ? co.defaultBreaks : [];
  const overrides = Array.isArray(co.dateOverrides) ? co.dateOverrides : [];
  const ymd = String(dateYmd || "").slice(0, 10);

  const ov = overrides.find((o) => String(o?.date || "").slice(0, 10) === ymd);
  if (ov) {
    if (ov.type === "closed" || ov.closed === true) {
      return {
        closed: true,
        workIntervals: [],
        breaks: [],
        reasonsJa: ["教室休業日（日付例外）"],
      };
    }
    if (ov.type === "short" || (ov.open && ov.close) || (ov.start && ov.end)) {
      const open = normalizeClockFragment(ov.open || ov.start, defOpen);
      const close = normalizeClockFragment(ov.close || ov.end, defClose);
      const s = timeToMinutes(open);
      const e = timeToMinutes(close);
      if (e <= s) {
        return { closed: true, workIntervals: [], breaks: [], reasonsJa: ["短縮営業の時間設定が無効です"] };
      }
      const breaks = Array.isArray(ov.breaks) ? ov.breaks : defaultBreaks;
      return {
        closed: false,
        workIntervals: [{ startMin: s, endMin: e }],
        breaks,
        reasonsJa: [],
      };
    }
    if (ov.type === "special") {
      const open = normalizeClockFragment(ov.open || ov.start || defOpen);
      const close = normalizeClockFragment(ov.close || ov.end || defClose);
      const s = timeToMinutes(open);
      const e = timeToMinutes(close);
      if (e <= s) {
        return { closed: true, workIntervals: [], breaks: [], reasonsJa: ["特別営業の時間設定が無効です"] };
      }
      return {
        closed: false,
        workIntervals: [{ startMin: s, endMin: e }],
        breaks: Array.isArray(ov.breaks) ? ov.breaks : defaultBreaks,
        reasonsJa: [],
      };
    }
  }

  const wd = tokyoWeekdayIndex(ymd);
  const wh = co.weekdayHours || {};
  const dayRule = wh[String(wd)] ?? wh[wd];
  if (dayRule && dayRule.closed === true) {
    return {
      closed: true,
      workIntervals: [],
      breaks: [],
      reasonsJa: ["教室休業（曜日設定）"],
    };
  }

  const open = normalizeClockFragment(dayRule?.open || dayRule?.start || defOpen);
  const close = normalizeClockFragment(dayRule?.close || dayRule?.end || defClose);
  const s = timeToMinutes(open);
  const e = timeToMinutes(close);
  if (e <= s) {
    return { closed: true, workIntervals: [], breaks: [], reasonsJa: ["営業時間外（曜日・基本設定）"] };
  }
  const breaks = [...defaultBreaks, ...(Array.isArray(dayRule?.breaks) ? dayRule.breaks : [])];
  return {
    closed: false,
    workIntervals: [{ startMin: s, endMin: e }],
    breaks,
    reasonsJa: [],
  };
}

export function slotMeetsClassroomSchedule(slotDate, slotTime, durationMinutes, classroomOperations) {
  const sched = getClassroomDaySchedule(classroomOperations, slotDate);
  if (sched.closed) {
    return { ok: false, reasonsJa: sched.reasonsJa.length ? sched.reasonsJa : ["教室休業"] };
  }
  const start = timeToMinutes(slotTime);
  const end = start + Math.max(0, Number(durationMinutes || 0));
  if (!lessonInsideWorkWindow(start, end, sched.workIntervals)) {
    return { ok: false, reasonsJa: ["営業時間外"] };
  }
  if (lessonOverlapsBreak(start, end, sched.breaks)) {
    return { ok: false, reasonsJa: ["教室休憩時間と重なります"] };
  }
  return { ok: true, reasonsJa: [] };
}

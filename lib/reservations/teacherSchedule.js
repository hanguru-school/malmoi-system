import { intervalsOverlap, normalizeClockFragment, timeToMinutes, tokyoWeekdayIndex } from "./timeMath.js";

/**
 * 講師プロフィールから「その日の受付区間」（分）を返す。
 * @returns {null|Array<{startMin:number,endMin:number}>} null = プロファイルなし（チェックスキップ可）
 */
export function getTeacherWorkIntervalsMinutes(profile, dateYmd) {
  if (!profile || typeof profile !== "object") return null;
  const ymd = String(dateYmd || "").slice(0, 10);
  const exceptions = Array.isArray(profile.exceptions) ? profile.exceptions : [];
  const dayOff = exceptions.find((ex) => String(ex?.date || "").slice(0, 10) === ymd && (ex.type === "off" || ex.closed === true));
  if (dayOff) {
    return [];
  }

  const wd = tokyoWeekdayIndex(ymd);
  const weekly = profile.weekly || {};
  const day = weekly[String(wd)] ?? weekly[wd];

  let intervals = [];
  if (Array.isArray(day)) intervals = day;
  else if (day && Array.isArray(day.intervals)) intervals = day.intervals;
  else if (day && day.start && day.end) intervals = [{ start: day.start, end: day.end }];

  const out = intervals
    .map((it) => {
      const a = normalizeClockFragment(it?.start || it?.open || "10:00");
      const b = normalizeClockFragment(it?.end || it?.close || "19:00");
      const s = timeToMinutes(a);
      const e = timeToMinutes(b);
      if (e <= s) return null;
      return { startMin: s, endMin: e };
    })
    .filter(Boolean);

  const adminLocks = Array.isArray(profile.adminLocks) ? profile.adminLocks : [];
  for (const lock of adminLocks) {
    if (String(lock?.date || "").slice(0, 10) !== ymd) continue;
    const ls = timeToMinutes(lock?.start || lock?.from || "00:00");
    const le = timeToMinutes(lock?.end || lock?.to || "23:59");
    if (le <= ls) continue;
    // 簡易: ロック区間と重なる受付区間を分割縮小（完全版は差分集合）
    const next = [];
    for (const iv of out) {
      if (!intervalsOverlap(iv.startMin, iv.endMin, ls, le)) {
        next.push(iv);
        continue;
      }
      if (iv.startMin < ls) next.push({ startMin: iv.startMin, endMin: Math.min(iv.endMin, ls) });
      if (iv.endMin > le) next.push({ startMin: Math.max(iv.startMin, le), endMin: iv.endMin });
    }
    out.length = 0;
    out.push(...next.filter((x) => x.endMin > x.startMin));
  }

  return out;
}

export function slotFitsTeacherIntervals(slotDate, slotTime, durationMinutes, intervals) {
  if (intervals === null) return { ok: true, reasonsJa: [] };
  const start = timeToMinutes(slotTime);
  const end = start + Math.max(0, Number(durationMinutes || 0));
  if (intervals.length === 0) {
    return { ok: false, reasonsJa: ["講師の受付時間外（未設定または休み）"] };
  }
  const ok = intervals.some((iv) => start >= iv.startMin && end <= iv.endMin);
  if (!ok) return { ok: false, reasonsJa: ["講師の受付時間外"] };
  return { ok: true, reasonsJa: [] };
}

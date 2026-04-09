/** 管理画面・ポータル共通の曜日・時刻UIヘルパ（クライアント可） */

export const WEEKDAY_ORDER_TOKYO = [1, 2, 3, 4, 5, 6, 0]; // 月…日（tokyoWeekdayIndex）

export const WEEKDAY_LABEL_JA = {
  0: "日",
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土",
};

/** 5分刻み 07:00–23:55 */
export function buildTimeOptions(stepMinutes = 5) {
  const out = [];
  for (let m = 7 * 60; m < 24 * 60; m += stepMinutes) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
}

export const TIME_OPTIONS_5 = buildTimeOptions(5);

export function emptyWeekdayHours() {
  return {};
}

export function getDayRule(weekdayHours, wd, fallbackOpen, fallbackClose) {
  const wh = weekdayHours || {};
  const raw = wh[String(wd)] ?? wh[wd];
  if (!raw) {
    return {
      closed: false,
      open: fallbackOpen || "10:00",
      close: fallbackClose || "19:00",
      breaks: [],
    };
  }
  if (raw.closed === true) {
    return { closed: true, open: fallbackOpen || "10:00", close: fallbackClose || "19:00", breaks: [] };
  }
  const open = raw.open || raw.start || fallbackOpen || "10:00";
  const close = raw.close || raw.end || fallbackClose || "19:00";
  const breaks = Array.isArray(raw.breaks) ? raw.breaks : [];
  return { closed: false, open, close, breaks };
}

export function setDayRule(weekdayHours, wd, rule) {
  const next = { ...(weekdayHours || {}) };
  if (rule.closed) {
    next[String(wd)] = { closed: true };
  } else {
    next[String(wd)] = {
      open: rule.open,
      close: rule.close,
      breaks: Array.isArray(rule.breaks) ? rule.breaks : [],
    };
  }
  return next;
}

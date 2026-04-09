/**
 * UI モデル ↔ API（classroomOperations）変換
 * 保存形式は既存ストア互換: defaultOpen/Close/Breaks, weekdayHours, dateOverrides
 *
 * UI モデル: { open, close, breaks, weekdays, exceptions }
 */

import { getDayRule } from "./scheduleVisualShared.js";

export const WD_KEYS = [1, 2, 3, 4, 5, 6, 0];

export function emptyUiModel(schoolBasic = {}) {
  return {
    open: schoolBasic?.businessHoursStart || "10:00",
    close: schoolBasic?.businessHoursEnd || "19:00",
    breaks: [{ start: "12:00", end: "13:00" }],
    weekdays: {},
    exceptions: [],
  };
}

/** @param {object} co classroomOperations */
export function fromClassroomOperations(co, schoolBasic = {}) {
  const c = co || {};
  const base = emptyUiModel(schoolBasic);
  base.open = c.defaultOpen || base.open;
  base.close = c.defaultClose || base.close;
  base.breaks = Array.isArray(c.defaultBreaks) && c.defaultBreaks.length ? c.defaultBreaks.map((b) => ({ ...b })) : base.breaks;
  base.weekdays = {};
  for (const wd of WD_KEYS) {
    const rule = getDayRule(c.weekdayHours || {}, wd, base.open, base.close);
    base.weekdays[String(wd)] = rule.closed
      ? { closed: true }
      : { closed: false, open: rule.open, close: rule.close, breaks: [...(rule.breaks || [])] };
  }
  base.exceptions = Array.isArray(c.dateOverrides) ? c.dateOverrides.map((x) => ({ ...x })) : [];
  return base;
}

/** @param {ReturnType<typeof fromClassroomOperations>} model */
export function toClassroomOperationsPatch(model) {
  const weekdayHours = {};
  for (const wd of WD_KEYS) {
    const w = model.weekdays[String(wd)] ?? model.weekdays[wd];
    if (!w || w.closed) {
      weekdayHours[String(wd)] = { closed: true };
    } else {
      weekdayHours[String(wd)] = {
        open: w.open || model.open,
        close: w.close || model.close,
        breaks: Array.isArray(w.breaks) ? w.breaks : [],
      };
    }
  }
  const mon = getDayRule(weekdayHours, 1, model.open, model.close);
  return {
    defaultOpen: mon.closed ? model.open : mon.open,
    defaultClose: mon.closed ? model.close : mon.close,
    defaultBreaks: Array.isArray(model.breaks) ? model.breaks : [],
    weekdayHours,
    dateOverrides: Array.isArray(model.exceptions) ? model.exceptions : [],
  };
}

export function setWeekdayInModel(model, wd, rule) {
  const nextWeekdays = { ...model.weekdays };
  nextWeekdays[String(wd)] = rule;
  return { ...model, weekdays: nextWeekdays };
}

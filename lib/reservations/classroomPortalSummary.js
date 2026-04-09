import { WEEKDAY_LABEL_JA, WEEKDAY_ORDER_TOKYO, getDayRule } from "./scheduleVisualShared.js";

/**
 * 学生・講師ポータル向け：週次の教室営業時間を短文行に（JSONは出さない）
 * @returns {{ rows: { wd: number, label: string, closed: boolean, text: string }[] }}
 */
export function buildClassroomWeekPortalRows(classroomOperations, schoolBasic) {
  const co = classroomOperations || {};
  const sb = schoolBasic || {};
  const fo = co.defaultOpen || sb.businessHoursStart || "10:00";
  const fc = co.defaultClose || sb.businessHoursEnd || "19:00";
  const wh = co.weekdayHours || {};
  const rows = WEEKDAY_ORDER_TOKYO.map((wd) => {
    const rule = getDayRule(wh, wd, fo, fc);
    let text = rule.closed ? "休業" : `${rule.open}〜${rule.close}`;
    if (!rule.closed && rule.breaks?.length) {
      text += `（休憩 ${rule.breaks.map((b) => `${b.start || ""}–${b.end || ""}`).join(", ")}）`;
    }
    return { wd, label: WEEKDAY_LABEL_JA[wd], closed: rule.closed, text };
  });
  return { rows };
}

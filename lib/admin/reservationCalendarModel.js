/**
 * 관리자 예약 캘린더용 공통 범위·이벤트 모델 (V1 패널에서 사용)
 */

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function parseYmd(iso) {
  const [y, m, d] = String(iso || "").split("-").map((t) => Number(t));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function addDaysYmd(iso, delta) {
  const base = parseYmd(iso) || new Date();
  base.setDate(base.getDate() + delta);
  return formatYmd(base);
}

export function addMonthsYmd(iso, delta) {
  const base = parseYmd(iso) || new Date();
  base.setMonth(base.getMonth() + Number(delta || 0));
  return formatYmd(base);
}

export function startOfWeekMondayIso(iso) {
  const base = parseYmd(iso) || new Date();
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return formatYmd(base);
}

export function addMinutesToClock(time, minutes) {
  const [h, mi] = String(time || "09:00").split(":").map((t) => Number(t));
  if (!Number.isFinite(h) || !Number.isFinite(mi)) return "09:00";
  let total = h * 60 + mi + Math.max(0, Number(minutes || 0));
  if (total < 0) total = 0;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${pad2(nh)}:${pad2(nm)}`;
}

/**
 * 월/주/일 뷰에 맞춰 API 조회용 fromDate / toDate
 */
export function computeReservationFetchRange(scheduleView, anchorIso) {
  const day = String(anchorIso || "").slice(0, 10) || formatYmd(new Date());
  if (scheduleView === "month") {
    const base = parseYmd(day) || new Date();
    const y = base.getFullYear();
    const m = base.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return { fromDate: formatYmd(start), toDate: formatYmd(end) };
  }
  if (scheduleView === "week") {
    const start = parseYmd(startOfWeekMondayIso(day)) || new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { fromDate: formatYmd(start), toDate: formatYmd(end) };
  }
  return { fromDate: day, toDate: day };
}

/**
 * 리스트/일/주/월에서 동일하게 쓰는 최소 이벤트 필드
 */
export function reservationRowToCalendarEvent(row) {
  const date = String(row?.date || "").slice(0, 10);
  const timeRaw = String(row?.time || "09:00");
  const time = timeRaw.length >= 5 ? timeRaw.slice(0, 5) : "09:00";
  const dm = Math.max(15, Number(row?.durationMinutes || 60));
  const endClock = addMinutesToClock(time, dm);
  const lessonName =
    String(row?.slotLabel || "").trim() ||
    (row?.slotLessonMode === "group"
      ? "グループ"
      : row?.slotLessonMode === "one_on_one"
        ? "1:1"
        : "レッスン");
  return {
    id: String(row?.id || ""),
    date,
    startAt: `${date}T${time}:00`,
    endAt: `${date}T${endClock}:00`,
    studentName: String(row?.studentNameKanji || row?.studentNameFurigana || "").trim() || "—",
    teacherName: String(row?.instructorName || "").trim() || "—",
    lessonName,
    status: String(row?.status || ""),
    mode: String(row?.lessonDeliveryType || "") === "online" ? "online" : "in_person",
  };
}

export function sortCalendarEventsByStart(events) {
  return [...(events || [])].sort((a, b) =>
    String(a.startAt || "").localeCompare(String(b.startAt || ""))
  );
}

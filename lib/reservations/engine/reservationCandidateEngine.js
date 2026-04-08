import { evaluateAdminBookingSlot, findLessonServiceFromStore } from "../adminSlotEvaluation.js";
import { normalizeLessonServiceCatalogEntry } from "../lessonServiceModel.js";
import { getClassroomDaySchedule } from "../classroomSchedule.js";
import { inferReasonCodeFromMessageJa, ReasonCodes } from "./reasonCodes.js";
import { minutesToClock, timeToMinutes } from "../timeMath.js";

function isActiveReservationStatus(status) {
  const v = String(status || "").trim();
  return v !== "cancelled" && v !== "rejected";
}

function countActiveReservationsInSlot(store, slotId) {
  return store.reservations.filter(
    (r) => r.slotId === slotId && isActiveReservationStatus(r.status)
  ).length;
}

function resolveTeacherName(store, instructorUserId) {
  const id = String(instructorUserId || "").trim();
  if (!id) return "";
  const u = store.users?.find((x) => String(x.id) === id);
  return u?.displayName || u?.email || "";
}

function slotEndTime(startTime, durationMinutes) {
  const s = timeToMinutes(String(startTime || "00:00").slice(0, 5));
  return minutesToClock(s + Math.max(0, Number(durationMinutes || 0)));
}

function messagesToCodes(messages) {
  const codes = [];
  for (const m of messages || []) {
    codes.push(inferReasonCodeFromMessageJa(m));
  }
  return [...new Set(codes.filter(Boolean))];
}

/**
 * 既存スロットをレッスン・政策・在庫で評価し、候補一覧を返す（スロット生成エンジンと同じ評価関数を利用）
 *
 * @param {object} store readStore 相当
 * @param {object} payload
 * @param {string} payload.targetDate YYYY-MM-DD
 * @param {string} payload.lessonTypeId
 * @param {string} [payload.studentId]
 * @param {string} [payload.teacherId] フィルタ
 * @param {string} [payload.lessonDeliveryType] in_person | online
 * @param {"admin"|"student"} [payload.actorRole]
 */
export function buildReservationCandidates(store, payload = {}) {
  const targetDate = String(payload.targetDate || payload.date || "").slice(0, 10);
  const lessonTypeId = String(payload.lessonTypeId || "").trim();
  const studentId = String(payload.studentId || "").trim();
  const teacherFilter = String(payload.teacherId || "").trim();
  const lessonDeliveryType = String(payload.lessonDeliveryType || "in_person").trim();
  const actorRole = String(payload.actorRole || "admin").trim() === "student" ? "student" : "admin";

  const out = {
    ok: true,
    targetDate,
    lessonType: null,
    daySummary: null,
    candidates: [],
    blockedReasons: [],
  };

  if (!targetDate || !lessonTypeId) {
    out.ok = false;
    out.blockedReasons.push({ code: ReasonCodes.UNKNOWN, messageJa: "日付またはレッスンIDが不足しています。" });
    return out;
  }

  const lessonRaw = findLessonServiceFromStore(store, lessonTypeId);
  if (!lessonRaw) {
    out.ok = false;
    out.blockedReasons.push({ code: ReasonCodes.UNKNOWN, messageJa: "レッスン設定が見つかりません。" });
    return out;
  }

  const lesson = normalizeLessonServiceCatalogEntry(lessonRaw);
  out.lessonType = {
    id: lesson.id,
    displayName: lesson.displayNameJa,
    durationMinutes: lesson.durationMinutes,
    pointCost: lesson.consumePoints,
    lessonMode: lesson.lessonFormat,
    active: lesson.enabled !== false,
  };

  const co = store.systemSettings?.classroomOperations || {};
  const daySched = getClassroomDaySchedule(co, targetDate);
  if (daySched.closed) {
    out.daySummary = {
      closed: true,
      codes: [ReasonCodes.CLASSROOM_CLOSED],
      messagesJa: daySched.reasonsJa?.length ? daySched.reasonsJa : ["教室休業"],
    };
  }

  const student = studentId ? store.students?.find((s) => s.id === studentId) : null;
  if (studentId && !student) {
    out.blockedReasons.push({ code: ReasonCodes.UNKNOWN, messageJa: "学生が見つかりません。" });
  }
  if (student) {
    out.studentSnapshot = {
      remainingMinutes: Math.max(0, Number(student.lessonMinutes?.remainingMinutes ?? 0)),
      currentPoints: Number(student.points?.balance ?? 0),
    };
  }

  const slots = (store.reservationSlots || []).filter((s) => String(s.date) === targetDate);

  for (const slot of slots) {
    if (teacherFilter && String(slot.instructorUserId || "").trim() !== teacherFilter) {
      continue;
    }

    const activeReservationCount = countActiveReservationsInSlot(store, slot.id);
    const slotRow = {
      id: slot.id,
      date: slot.date,
      time: String(slot.time || "").slice(0, 5),
      durationMinutes: slot.durationMinutes,
      lessonMode: slot.lessonMode,
      capacity: slot.capacity,
      instructorUserId: slot.instructorUserId,
      instructorName: resolveTeacherName(store, slot.instructorUserId),
      status: slot.status,
      memo: slot.memo,
      activeReservationCount,
      availableCount: Math.max(0, Number(slot.capacity || 1) - activeReservationCount),
    };

    const ev = evaluateAdminBookingSlot(store, slotRow, {
      lessonService: lessonRaw,
      studentId,
      instructorFilterUserId: teacherFilter,
      lessonDeliveryType,
    });

    let blockCodes = messagesToCodes(ev.blockReasonsJa);
    let warnCodes = messagesToCodes(ev.warnReasonsJa);

    let bookingOk = ev.ok;
    if (student && lesson) {
      const bal = Math.max(0, Number(student.points?.balance ?? 0));
      const cost = Number(lesson.consumePoints || 0);
      if (cost > 0 && bal < cost) {
        const msg = "ポイント残高が不足しています";
        if (actorRole === "student") {
          bookingOk = false;
          blockCodes = [...new Set([...blockCodes, ReasonCodes.INSUFFICIENT_POINTS])];
          ev.blockReasonsJa = [...new Set([...ev.blockReasonsJa, msg])];
        } else {
          warnCodes = [...new Set([...warnCodes, ReasonCodes.INSUFFICIENT_POINTS])];
          ev.warnReasonsJa = [...new Set([...ev.warnReasonsJa, msg])];
        }
      }
      const remMin = Math.max(0, Number(student.lessonMinutes?.remainingMinutes ?? 0));
      if (remMin < Number(lesson.durationMinutes || 0)) {
        const msg = "残りレッスン時間が不足しています";
        if (actorRole === "student") {
          bookingOk = false;
          blockCodes = [...new Set([...blockCodes, ReasonCodes.INSUFFICIENT_MINUTES])];
          ev.blockReasonsJa = [...new Set([...ev.blockReasonsJa, msg])];
        } else {
          warnCodes = [...new Set([...warnCodes, ReasonCodes.INSUFFICIENT_MINUTES])];
          ev.warnReasonsJa = [...new Set([...ev.warnReasonsJa, msg])];
        }
      }
    }

    const pointCost = lesson.consumePoints;
    const remainingPointsAfterBooking =
      student && pointCost != null
        ? Math.max(0, Number(student.points?.balance ?? 0) - Number(pointCost))
        : null;
    const remainingMinutesAfterBooking =
      student && lesson.durationMinutes
        ? Math.max(0, Number(student.lessonMinutes?.remainingMinutes ?? 0) - Number(lesson.durationMinutes))
        : null;

    out.candidates.push({
      slotId: slot.id,
      date: slot.date,
      durationMinutes: slot.durationMinutes,
      startTime: slotRow.time,
      endTime: slotEndTime(slotRow.time, slot.durationMinutes),
      teacherId: slot.instructorUserId || null,
      teacherName: slotRow.instructorName || resolveTeacherName(store, slot.instructorUserId),
      capacity: slot.capacity,
      activeReservationCount,
      pointCost,
      remainingPointsAfterBooking,
      remainingMinutesAfterBooking,
      bookingOk,
      reasonCodes: [...new Set([...blockCodes, ...warnCodes])],
      blockReasonsJa: ev.blockReasonsJa,
      warnReasonsJa: ev.warnReasonsJa,
    });
  }

  return out;
}

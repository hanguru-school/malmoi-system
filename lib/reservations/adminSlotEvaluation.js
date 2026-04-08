import { slotMeetsClassroomSchedule } from "./classroomSchedule.js";
import { getTeacherWorkIntervalsMinutes, slotFitsTeacherIntervals } from "./teacherSchedule.js";
import {
  lessonDeliveryAllowedByService,
  normalizeLessonServiceCatalogEntry,
  teacherAllowedForService,
} from "./lessonServiceModel.js";
import { timeToMinutes } from "./timeMath.js";

function isTimeOverlap(aTime, aDuration, bTime, bDuration) {
  const aStart = timeToMinutes(aTime);
  const bStart = timeToMinutes(bTime);
  const aEnd = aStart + Math.max(0, Number(aDuration || 0));
  const bEnd = bStart + Math.max(0, Number(bDuration || 0));
  return aStart < bEnd && bStart < aEnd;
}

function studentHasConflict(store, studentId, date, time, durationMinutes) {
  const conflicting = store.reservations?.find((reservation) => {
    if (!isActiveReservationStatus(reservation.status)) return false;
    if (reservation.studentId !== studentId) return false;
    if (reservation.date !== date) return false;
    return isTimeOverlap(reservation.time, reservation.durationMinutes, time, durationMinutes);
  });
  return Boolean(conflicting);
}

function isActiveReservationStatus(status) {
  const v = String(status || "").trim();
  return v !== "cancelled" && v !== "rejected";
}

function findInstructorOverlapReservation(store, instructorUserId, date, time, durationMinutes, excludeSlotId) {
  const tid = String(instructorUserId || "").trim();
  if (!tid) return null;
  const start = timeToMinutes(time);
  const end = start + Math.max(0, Number(durationMinutes || 0));
  return (
    store.reservations.find((r) => {
      if (!isActiveReservationStatus(r.status)) return false;
      if (String(r.date || "") !== String(date || "")) return false;
      const rtid = String(r.instructorUserId || "").trim();
      if (!rtid || rtid !== tid) return false;
      const rs = timeToMinutes(r.time);
      const re = rs + Math.max(0, Number(r.durationMinutes || 0));
      return start < re && rs < end;
    }) || null
  );
}

/**
 * 管理画面: スロットがレッスン・教室・講師・学生条件を満たすか評価
 * @param {object} store readStore 相当のオブジェクト（reservations, students, systemSettings, teacherAvailabilityProfiles）
 * @param {object} slot listReservationSlots 相当
 * @param {object} ctx
 */
export function evaluateAdminBookingSlot(store, slot, ctx = {}) {
  const blocks = [];
  const warns = [];

  const lessonRaw = ctx.lessonService;
  if (!lessonRaw) {
    warns.push("レッスン未選択のため、時間の整合のみ確認しています。");
  }
  const lesson = lessonRaw ? normalizeLessonServiceCatalogEntry(lessonRaw) : null;

  if (lesson && lesson.enabled === false) {
    blocks.push("このレッスンは無効です");
  }

  if (slot.status !== "open") {
    blocks.push("スロットが閉じられています");
  }

  const slotStartMs = new Date(`${slot.date}T${String(slot.time || "").slice(0, 5)}:00`).getTime();
  if (!Number.isFinite(slotStartMs) || slotStartMs <= Date.now()) {
    blocks.push("開始時刻を過ぎています");
  }

  const activeCount = Number(slot.activeReservationCount ?? 0);
  const cap = Math.max(1, Number(slot.capacity || 1));
  if (activeCount >= cap) {
    blocks.push("定員に達しています");
  }

  if (lesson) {
    if (Number(slot.durationMinutes || 0) !== Number(lesson.durationMinutes)) {
      blocks.push("レッスン所要時間とスロット長さが一致しません");
    }
  }

  const delivery = String(ctx.lessonDeliveryType || "in_person").trim();
  if (lesson && !lessonDeliveryAllowedByService(lesson, delivery)) {
    blocks.push("レッスン形式（対面/オンライン）が一致しません");
  }

  const classroom = store.systemSettings?.classroomOperations || {};
  const cls = slotMeetsClassroomSchedule(slot.date, slot.time, slot.durationMinutes, classroom);
  if (!cls.ok) blocks.push(...cls.reasonsJa);

  const instructorFilter = String(ctx.instructorFilterUserId || "").trim();
  const slotInstructor = String(slot.instructorUserId || "").trim();
  const effectiveInstructor = instructorFilter || slotInstructor;

  if (lesson) {
    const ta = teacherAllowedForService(lesson, slotInstructor);
    if (!ta.ok) warns.push(...ta.reasonsJa);
    if (instructorFilter && slotInstructor && instructorFilter !== slotInstructor) {
      blocks.push("選択した講師とスロットの講師が一致しません");
    }
  }

  const profile = store.teacherAvailabilityProfiles?.find(
    (p) => String(p.teacherUserId || "") === effectiveInstructor
  );
  if (effectiveInstructor && !profile) {
    warns.push("講師受付カレンダーが未登録です（時間制約は参考のみ）");
  }
  const intervals = effectiveInstructor && profile ? getTeacherWorkIntervalsMinutes(profile, slot.date) : null;
  if (effectiveInstructor && profile) {
    const fit = slotFitsTeacherIntervals(slot.date, slot.time, slot.durationMinutes, intervals);
    if (!fit.ok) {
      if (intervals && intervals.length === 0) {
        warns.push(...fit.reasonsJa);
      } else {
        blocks.push(...fit.reasonsJa);
      }
    }
  }

  const ov = findInstructorOverlapReservation(
    store,
    effectiveInstructor,
    slot.date,
    slot.time,
    slot.durationMinutes,
    slot.id
  );
  if (ov) {
    blocks.push("同一講師の別予約と時間が重なります");
  }

  const studentId = String(ctx.studentId || "").trim();
  if (studentId && studentHasConflict(store, studentId, slot.date, slot.time, slot.durationMinutes)) {
    blocks.push("学生の同一時間帯に予約があります");
  }

  const reservationSettings = store.systemSettings?.reservation || {};
  const leadMin = Math.max(0, Number(reservationSettings.minBookingLeadMinutes || 0));
  if (leadMin > 0 && Number.isFinite(slotStartMs)) {
    const needMs = leadMin * 60 * 1000;
    if (slotStartMs - Date.now() < needMs) {
      warns.push(`最低準備時間（約${leadMin}分）を下回る開始時刻です`);
    }
  }

  if (studentId && lesson) {
    const st = store.students?.find((s) => s.id === studentId);
    if (st) {
      const rem = Math.max(0, Number(st.lessonMinutes?.remainingMinutes ?? 0));
      if (rem < Number(lesson.durationMinutes || 0)) {
        warns.push("残りレッスン時間が不足している可能性があります");
      }
    }
  }

  const ok = blocks.length === 0;
  return {
    ok,
    blockReasonsJa: [...new Set(blocks)],
    warnReasonsJa: [...new Set(warns)],
    labelsJa: [...new Set([...blocks, ...warns])],
  };
}

export function findLessonServiceFromStore(store, lessonServiceId) {
  const id = String(lessonServiceId || "").trim();
  if (!id) return null;
  const services = store?.systemSettings?.lessonServiceCatalog?.services || [];
  const raw = services.find((s) => String(s?.id || "") === id);
  return raw || null;
}

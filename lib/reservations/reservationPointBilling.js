import crypto from "crypto";
import { pointsForMinutes } from "../operational/pointsPolicy.js";
import { findLessonServiceFromStore } from "./adminSlotEvaluation.js";
import { normalizeLessonServiceCatalogEntry } from "./lessonServiceModel.js";

export const PointLedgerTypes = {
  RESERVATION_CHARGE: "reservation_charge",
  REFUND: "refund",
  CANCEL_FEE: "cancel_fee",
  RESCHEDULE_ADJUSTMENT: "reschedule_adjustment",
};

function ledgerId() {
  return `pl_${crypto.randomBytes(10).toString("hex")}`;
}

export function ensurePointLedgers(store) {
  if (!Array.isArray(store.pointLedgers)) store.pointLedgers = [];
}

export function reservationPointLedgerRefundExists(store, reservationId) {
  ensurePointLedgers(store);
  const rid = String(reservationId || "").trim();
  if (!rid) return false;
  return store.pointLedgers.some(
    (e) =>
      String(e.relatedReservationId || "") === rid &&
      (e.type === PointLedgerTypes.REFUND || e.type === PointLedgerTypes.CANCEL_FEE)
  );
}

/**
 * @param {object} store
 * @param {{ durationMinutes?: number, lessonServiceId?: string|null }} ctx
 */
export function resolveReservationPointCost(store, ctx = {}) {
  const lessonServiceId = String(ctx.lessonServiceId || "").trim();
  const durationMinutes = Math.max(1, Number(ctx.durationMinutes || 0));
  if (lessonServiceId) {
    const raw = findLessonServiceFromStore(store, lessonServiceId);
    if (raw) {
      const svc = normalizeLessonServiceCatalogEntry(raw);
      return Math.max(0, Number(svc.consumePoints || 0));
    }
  }
  return pointsForMinutes(durationMinutes);
}

function readBalance(student) {
  return Number(student?.points?.balance ?? student?.pointsBalance ?? 0);
}

function touchPointsTotals(student, deltaUsed) {
  const pts = student.points || {};
  student.points = {
    ...pts,
    totalPurchasedPoints: Math.max(0, Number(pts.totalPurchasedPoints ?? 0)),
    totalUsedPoints: Math.max(0, Number(pts.totalUsedPoints ?? 0) + Number(deltaUsed || 0)),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 予約作成直後: ポイント減算 + ledger
 * @param {"student"|"admin"} bookingRole
 */
export function applyReservationPointCharge(store, student, reservation, pointCost, bookingRole, actor = null) {
  ensurePointLedgers(store);
  const cost = Math.max(0, Math.floor(Number(pointCost || 0)));
  if (cost === 0) {
    reservation.pointsCharged = 0;
    return { charged: 0, balanceAfter: readBalance(student) };
  }

  const before = readBalance(student);
  if (bookingRole === "student" && before < cost) {
    throw new Error("ポイント残高が不足しています。チャージ後にお試しください。");
  }

  const after = before - cost;
  student.points = student.points || {};
  student.points.balance = after;
  touchPointsTotals(student, cost);
  reservation.pointsCharged = cost;
  if (reservation.expectedPointsConsume == null) reservation.expectedPointsConsume = cost;

  const entry = {
    id: ledgerId(),
    studentId: student.id,
    type: PointLedgerTypes.RESERVATION_CHARGE,
    deltaPoints: -cost,
    balanceAfterPoints: after,
    relatedReservationId: reservation.id,
    relatedPaymentId: null,
    note: `予約 ${reservation.date} ${reservation.time}`,
    createdByUserId: actor?.userId || null,
    createdByRole: actor?.role || bookingRole,
    createdAt: new Date().toISOString(),
  };
  store.pointLedgers.push(entry);
  return { charged: cost, balanceAfter: after, ledgerId: entry.id };
}

/**
 * キャンセル時の返還ポイント（チャージ済みを前提）
 */
export function computeCancellationPointRefundAmount(store, reservation, cancelledByRole) {
  const charged = Math.max(0, Number(reservation.pointsCharged ?? 0));
  if (charged <= 0) return { refundPoints: 0, feePoints: 0 };

  const lessonRow = reservation.lessonServiceId
    ? findLessonServiceFromStore(store, String(reservation.lessonServiceId))
    : null;
  const policyKey = String(lessonRow?.cancelPolicyType || "").trim().toLowerCase();

  let ratio = 1;
  if (policyKey === "none" || policyKey === "no_refund" || policyKey === "non_refundable") {
    ratio = 0;
  } else if (policyKey === "half" || policyKey === "50" || policyKey === "50%") {
    ratio = 0.5;
  }

  if (cancelledByRole === "student") {
    ratio = 1;
  }

  const refundPoints = Math.floor(charged * ratio);
  const feePoints = charged - refundPoints;
  return { refundPoints, feePoints, charged };
}

export function applyReservationPointRefundOnCancel(store, student, reservation, cancelledByRole, actor = null) {
  ensurePointLedgers(store);
  if (reservation.pointsCharged == null) {
    return { ok: true, refundPoints: 0, feePoints: 0, skippedLegacy: true };
  }
  if (reservationPointLedgerRefundExists(store, reservation.id)) {
    return { ok: false, reason: "already_refunded" };
  }

  const { refundPoints, feePoints, charged } = computeCancellationPointRefundAmount(
    store,
    reservation,
    cancelledByRole
  );
  if (charged <= 0) return { ok: true, refundPoints: 0, feePoints: 0 };

  const before = readBalance(student);

  if (refundPoints > 0) {
    const afterRefund = before + refundPoints;
    student.points = student.points || {};
    student.points.balance = afterRefund;
    touchPointsTotals(student, -refundPoints);
    store.pointLedgers.push({
      id: ledgerId(),
      studentId: student.id,
      type: PointLedgerTypes.REFUND,
      deltaPoints: refundPoints,
      balanceAfterPoints: afterRefund,
      relatedReservationId: reservation.id,
      relatedPaymentId: null,
      note: `予約キャンセル返還 (${cancelledByRole})`,
      createdByUserId: actor?.userId || null,
      createdByRole: actor?.role || cancelledByRole,
      createdAt: new Date().toISOString(),
    });
  }

  if (feePoints > 0) {
    const bal = readBalance(student);
    store.pointLedgers.push({
      id: ledgerId(),
      studentId: student.id,
      type: PointLedgerTypes.CANCEL_FEE,
      deltaPoints: 0,
      balanceAfterPoints: bal,
      relatedReservationId: reservation.id,
      relatedPaymentId: null,
      note: `キャンセル手数料相当（ポイント非返還 ${feePoints}pt）`,
      createdByUserId: actor?.userId || null,
      createdByRole: actor?.role || cancelledByRole,
      createdAt: new Date().toISOString(),
    });
  }

  return { ok: true, refundPoints, feePoints };
}

/**
 * 予約変更時のポイント差額（増減）
 */
export function applyReservationPointRescheduleDelta(
  store,
  student,
  reservation,
  newPointCost,
  actor = null,
  bookingRole = "admin"
) {
  ensurePointLedgers(store);
  if (reservation.pointsCharged == null) {
    reservation.expectedPointsConsume = Math.max(0, Math.floor(Number(newPointCost || 0)));
    return { delta: 0, legacy: true };
  }
  const oldCharged = Math.max(0, Number(reservation.pointsCharged ?? 0));
  const next = Math.max(0, Math.floor(Number(newPointCost || 0)));
  const delta = next - oldCharged;
  if (delta === 0) {
    reservation.pointsCharged = next;
    reservation.expectedPointsConsume = next;
    return { delta: 0 };
  }

  const before = readBalance(student);
  if (delta > 0 && bookingRole === "student" && before < delta) {
    throw new Error("ポイント残高が不足しており、この時間への変更はできません。");
  }

  const after = before - delta;
  student.points = student.points || {};
  student.points.balance = after;
  touchPointsTotals(student, delta);

  reservation.pointsCharged = next;
  reservation.expectedPointsConsume = next;

  store.pointLedgers.push({
    id: ledgerId(),
    studentId: student.id,
    type: PointLedgerTypes.RESCHEDULE_ADJUSTMENT,
    deltaPoints: -delta,
    balanceAfterPoints: after,
    relatedReservationId: reservation.id,
    relatedPaymentId: null,
    note: `予約変更によるポイント調整 (${delta > 0 ? "追加徴収" : "返還含む"})`,
    createdByUserId: actor?.userId || null,
    createdByRole: actor?.role || bookingRole,
    createdAt: new Date().toISOString(),
  });

  return { delta, balanceAfter: after };
}

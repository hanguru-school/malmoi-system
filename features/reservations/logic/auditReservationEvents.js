/**
 * 予約関連 audit log の action 名（store の writeAuditLog と対応）
 * 参照用 — 実際の記録は lib/auth/store 内
 */

export const RESERVATION_AUDIT_ACTIONS = {
  CREATED: "reservation.created",
  UPDATED: "reservation.updated",
  CANCELLED: "reservation.cancelled",
  COMPLETED: "reservation.completed",
  SLOT_OPENED: "reservation.slot_opened",
  SLOT_CLOSED: "reservation.slot_closed",
  SLOT_UPDATED: "reservation.slot_updated",
};

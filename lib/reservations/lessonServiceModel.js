import { pointsForMinutes } from "../operational/pointsPolicy.js";

/**
 * レッスンサービスマスタ1件を正規化（予約エンジン・UI共通）
 */
export function normalizeLessonServiceCatalogEntry(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const durationMinutes = Math.max(5, Math.min(480, Number(r.durationMinutes || 60)));
  const prepBefore = Math.max(0, Number(r.prepBeforeMinutes ?? r.prepMinutes ?? 10));
  const prepAfter = Math.max(0, Number(r.prepAfterMinutes ?? 0));
  const consumePointsRaw = r.consumePoints;
  const consumePoints =
    consumePointsRaw != null && consumePointsRaw !== ""
      ? Math.max(0, Math.floor(Number(consumePointsRaw)))
      : pointsForMinutes(durationMinutes);

  return {
    id: String(r.id || "").trim() || `ls_${Math.random().toString(36).slice(2, 10)}`,
    name: String(r.name || "レッスン").trim(),
    displayNameJa: String(r.displayNameJa || r.displayName || r.name || "レッスン").trim(),
    description: String(r.description || "").trim(),
    durationMinutes,
    prepBeforeMinutes: prepBefore,
    prepAfterMinutes: prepAfter,
    prepMinutes: prepBefore + prepAfter,
    consumePoints,
    lessonFormat: String(r.lessonFormat || "both").trim(),
    teacherUserIds: Array.isArray(r.teacherUserIds)
      ? r.teacherUserIds.map((x) => String(x).trim()).filter(Boolean)
      : [],
    maxStudents: Math.max(1, Math.min(50, Number(r.maxStudents ?? 4))),
    allowPair: r.allowPair !== false,
    allowGroup: r.allowGroup === true,
    allowPrivate: r.allowPrivate !== false,
    onlineOk: r.onlineOk !== false,
    inPersonOk: r.inPersonOk !== false,
    enabled: r.enabled !== false,
    adminOnlyBooking: r.adminOnlyBooking === true,
    studentSelectable: r.studentSelectable !== false,
    allowReschedule: r.allowReschedule !== false,
    allowCancel: r.allowCancel !== false,
    cancelPolicyType: String(r.cancelPolicyType || "").trim(),
    sortOrder: Math.max(0, Math.floor(Number(r.sortOrder ?? 0))),
    imageDataUrl: String(r.imageDataUrl || "").trim(),
  };
}

export function lessonDeliveryAllowedByService(service, deliveryType) {
  const d = String(deliveryType || "in_person").trim();
  if (d === "online") return service.onlineOk !== false;
  if (d === "in_person") return service.inPersonOk !== false;
  return true;
}

export function teacherAllowedForService(service, instructorUserId) {
  const tid = String(instructorUserId || "").trim();
  const ids = service.teacherUserIds || [];
  if (!ids.length) return { ok: true, reasonsJa: [] };
  if (!tid) return { ok: false, reasonsJa: ["対応講師が未設定のスロットです"] };
  if (ids.includes(tid)) return { ok: true, reasonsJa: [] };
  return { ok: false, reasonsJa: ["このレッスンの対応講師ではありません"] };
}

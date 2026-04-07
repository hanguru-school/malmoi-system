/**
 * 管理画面予約: fetch ラッパー（既存 /api/admin/* 契約）
 */

export function buildAdminReservationsQuery(params) {
  const p = new URLSearchParams();
  if (params.fromDate) p.set("fromDate", params.fromDate);
  if (params.toDate) p.set("toDate", params.toDate);
  if (params.q) p.set("q", params.q);
  if (params.status) p.set("status", params.status);
  if (params.lessonMode) p.set("lessonMode", params.lessonMode);
  if (params.studentId) p.set("studentId", params.studentId);
  p.set("page", String(params.page || 1));
  p.set("pageSize", String(params.pageSize || 500));
  return p.toString();
}

export async function fetchAdminReservationsList(params) {
  const qs = buildAdminReservationsQuery(params);
  const response = await fetch(`/api/admin/reservations?${qs}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "予約一覧の取得に失敗しました。");
  return data;
}

export async function fetchAdminReservationSlotsRange(fromDate, toDate) {
  const sp = new URLSearchParams();
  sp.set("fromDate", fromDate);
  sp.set("toDate", toDate || fromDate);
  const response = await fetch(`/api/admin/reservation-slots?${sp.toString()}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "スロット取得に失敗しました。");
  return data;
}

export async function fetchAdminStudentsPage(page = 1, pageSize = 400) {
  const response = await fetch(`/api/admin/students?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "学生一覧の取得に失敗しました。");
  return data;
}

export async function patchAdminReservation(reservationId, body) {
  const response = await fetch(`/api/admin/reservations/${reservationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "更新に失敗しました。");
  return data;
}

export async function patchAdminReservationSlot(slotId, body) {
  const response = await fetch(`/api/admin/reservation-slots/${slotId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "スロット更新に失敗しました。");
  return data;
}

export async function postAdminReservationCreate(payload) {
  const response = await fetch("/api/admin/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "予約追加に失敗しました。");
  return data;
}

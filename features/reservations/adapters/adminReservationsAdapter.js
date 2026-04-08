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

export async function fetchAdminStudentById(studentId) {
  const id = String(studentId || "").trim();
  if (!id) throw new Error("学生IDが無効です。");
  const response = await fetch(`/api/admin/students/${encodeURIComponent(id)}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "学生情報の取得に失敗しました。");
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

export async function cancelAdminReservation(reservationId, body = {}) {
  const response = await fetch(`/api/admin/reservations/${reservationId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "キャンセルに失敗しました。");
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

export async function fetchAdminReservationSlotsEvaluated(body) {
  const response = await fetch("/api/admin/reservation-slots/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "スロット評価に失敗しました。");
  return data;
}

export async function fetchAdminStudentsSearch(q, pageSize = 80) {
  const sp = new URLSearchParams();
  sp.set("q", String(q || "").trim());
  sp.set("limit", String(pageSize));
  const response = await fetch(`/api/admin/students/search?${sp.toString()}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "学生検索に失敗しました。");
  return data;
}

/** レッスンタイプ一覧（設定マスタ） */
export async function fetchAdminLessonTypes() {
  const response = await fetch("/api/admin/lesson-types", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "レッスン一覧の取得に失敗しました。");
  return data;
}

/** 予約候補（理由コード付き） */
export async function postAdminReservationCandidates(body) {
  const response = await fetch("/api/admin/reservations/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "候補の取得に失敗しました。");
  return data;
}

export async function fetchAdminSystemSettings() {
  const response = await fetch("/api/admin/system-settings", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "設定の取得に失敗しました。");
  return data;
}

export async function fetchAdminAuditLogs(params = {}) {
  const sp = new URLSearchParams();
  if (params.targetType) sp.set("targetType", params.targetType);
  if (params.fromDate) sp.set("fromDate", params.fromDate);
  if (params.toDate) sp.set("toDate", params.toDate);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  const response = await fetch(`/api/admin/audit-logs?${sp.toString()}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data?.error || "監査ログの取得に失敗しました。");
  return data;
}

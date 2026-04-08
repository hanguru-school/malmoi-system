/**
 * 学生予約 API クライアント（fetch のみ・既存契約）
 */

export async function fetchStudentReservations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const response = await fetch(`/api/student/reservations?${params.toString()}`);
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "予約の取得に失敗しました。");
  }
  return data;
}

export async function fetchStudentLessonTypes() {
  const response = await fetch("/api/student/lesson-types", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "レッスン一覧の取得に失敗しました。");
  }
  return data;
}

export async function fetchStudentReservationSlots() {
  const response = await fetch("/api/student/reservation-slots");
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "予約可能時間の取得に失敗しました。");
  }
  return data;
}

/** 理由コード付き候補（予約エンジン共有・学生は actorRole 固定） */
export async function fetchStudentReservationCandidates(params = {}) {
  const sp = new URLSearchParams();
  if (params.lessonTypeId) sp.set("lessonTypeId", params.lessonTypeId);
  if (params.date) sp.set("date", params.date);
  if (params.fromDate) sp.set("fromDate", params.fromDate);
  if (params.toDate) sp.set("toDate", params.toDate);
  if (params.teacherId) sp.set("teacherId", params.teacherId);
  if (params.lessonMode) sp.set("lessonMode", params.lessonMode);
  const response = await fetch(`/api/student/reservation-candidates?${sp.toString()}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "候補の取得に失敗しました。");
  }
  return data;
}

export async function postStudentReservation(payload) {
  const response = await fetch("/api/student/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "予約作成に失敗しました。");
  }
  return data;
}

export async function patchStudentReservation(reservationId, body) {
  const response = await fetch(`/api/student/reservations/${reservationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "予約変更に失敗しました。");
  }
  return data;
}

export async function postStudentReservationCancel(reservationId) {
  const response = await fetch(`/api/student/reservations/${reservationId}/cancel`, { method: "POST" });
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "予約キャンセルに失敗しました。");
  }
  return data;
}

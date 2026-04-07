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

export async function fetchStudentReservationSlots() {
  const response = await fetch("/api/student/reservation-slots");
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "予約可能時間の取得に失敗しました。");
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

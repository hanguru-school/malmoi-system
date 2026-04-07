/**
 * 管理画面: 学生一覧 API（既存 /api/admin/students 契約）
 */

export function buildAdminStudentsQuery(filters = {}, page, pageSize) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.registrationStatus) params.set("registrationStatus", filters.registrationStatus);
  if (filters.consentStatus) params.set("consentStatus", filters.consentStatus);
  if (filters.linked) params.set("linked", filters.linked);
  if (filters.riskSignal) params.set("riskSignal", filters.riskSignal);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}

export async function fetchAdminStudentsList(filters, page, pageSize) {
  const query = buildAdminStudentsQuery(filters, page, pageSize);
  const response = await fetch(`/api/admin/students${query ? `?${query}` : ""}`);
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "学生一覧の取得に失敗しました。");
  }
  return data;
}

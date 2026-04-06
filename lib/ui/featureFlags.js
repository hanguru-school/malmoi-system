/**
 * UI バージョン切替（ルート・API・保存形式は不変）
 *
 * 優先: ?ui=v1 | ?ui=v2 → 環境変数 NEXT_PUBLIC_* → 既定 V1
 */

export function resolveUiMode(uiParam) {
  const p = String(uiParam || "").trim().toLowerCase();
  if (p === "v1") return "v1";
  if (p === "v2") return "v2";
  return null;
}

function useUiV2(uiParam, envName) {
  const explicit = resolveUiMode(uiParam);
  if (explicit === "v1") return false;
  if (explicit === "v2") return true;
  return String(process.env[envName] || "").toLowerCase() === "true";
}

export function useReservationUiV2(uiParam) {
  return useUiV2(uiParam, "NEXT_PUBLIC_USE_RESERVATION_UI_V2");
}

/** 学生 /admin の予約画面は同一フラグ（必要なら将来分割） */
export function useAdminReservationUiV2(uiParam) {
  return useReservationUiV2(uiParam);
}

export function useStudentRegistrationUiV2(uiParam) {
  return useUiV2(uiParam, "NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2");
}

export function useAdminStudentsUiV2(uiParam) {
  return useUiV2(uiParam, "NEXT_PUBLIC_USE_ADMIN_STUDENTS_UI_V2");
}

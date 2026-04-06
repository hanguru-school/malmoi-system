/**
 * クライアント専用: 登録完了後〜学生エリアで予約 UI（V2/V1）の連続性を保つ
 * （サーバー・AUTH_STORE は変更しない）
 */

export const RESERVATION_UI_STORAGE_KEY = "malmoi.student.reservationUi";

export function rememberReservationUiPreference(ui) {
  if (typeof window === "undefined") return;
  const u = String(ui || "").trim().toLowerCase();
  if (u === "v2" || u === "v1") {
    try {
      window.sessionStorage.setItem(RESERVATION_UI_STORAGE_KEY, u);
    } catch {
      /* ignore */
    }
  }
}

export function readReservationUiPreference() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(RESERVATION_UI_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 保存値 → 予約画面パス（未設定時は NEXT_PUBLIC_USE_RESERVATION_UI_V2） */
export function studentReservationsPathFromBrowserPreference() {
  const stored = readReservationUiPreference();
  if (stored === "v2") return "/student/reservations?ui=v2";
  if (stored === "v1") return "/student/reservations?ui=v1";
  if (String(process.env.NEXT_PUBLIC_USE_RESERVATION_UI_V2 || "").toLowerCase() === "true") {
    return "/student/reservations?ui=v2";
  }
  return "/student/reservations";
}

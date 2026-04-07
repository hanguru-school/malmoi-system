/**
 * 登録完了後の遷移先（予約 V2 との連続体験）
 */

import { resolveUiMode } from "../ui/featureFlags";

function envRegistrationV2() {
  return String(process.env.NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2 || "").toLowerCase() === "true";
}

function envReservationV2() {
  return String(process.env.NEXT_PUBLIC_USE_RESERVATION_UI_V2 || "").toLowerCase() === "true";
}

/**
 * 登録フロー完了直後に予約 V2 を優先するか（query または env）
 */
export function shouldChainReservationV2(registrationUi) {
  const explicit = resolveUiMode(registrationUi);
  if (explicit === "v2") return true;
  if (explicit === "v1") return false;
  return envRegistrationV2() || envReservationV2();
}

/** クライアント: 予約画面への href（?ui=v2 を維持） */
export function studentReservationHrefFromContext(registrationUi) {
  return shouldChainReservationV2(registrationUi) ? "/student/reservations?ui=v2" : "/student/reservations";
}

/**
 * マイページ（/student）へ。登録→予約 V2 連鎖時は ?resUi=v2 を付与し、ダッシュボードのリンクと整合
 */
export function studentMypageHrefAfterRegistration(registrationUi) {
  return shouldChainReservationV2(registrationUi) ? "/student?resUi=v2" : "/student";
}

function readResUiFromSearchParams(searchParams) {
  if (!searchParams) return null;
  if (typeof searchParams.get === "function") {
    return searchParams.get("resUi");
  }
  if (typeof searchParams === "object") {
    const raw = searchParams.resUi;
    const v = Array.isArray(raw) ? raw[0] : raw;
    return v != null && v !== "" ? String(v) : null;
  }
  return null;
}

/**
 * サーバー（ホーム）: URL の resUi と env から予約パスを決定
 * @param {URLSearchParams|Record<string, string|string[]|undefined>|{ get: (k:string)=>string|null }} searchParams
 */
export function studentReservationsPathFromHomeQuery(searchParams) {
  const resUi = readResUiFromSearchParams(searchParams);
  if (resUi === "v2") return "/student/reservations?ui=v2";
  if (resUi === "v1") return "/student/reservations?ui=v1";
  return studentReservationHrefFromContext(null);
}

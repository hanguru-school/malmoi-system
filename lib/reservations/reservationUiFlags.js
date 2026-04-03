/**
 * 予約UI V2 切替（既存ルート維持・即時ロールバック用）
 *
 * - URL: ?ui=v2 で V2 / ?ui=v1 で V1 強制
 * - 環境: NEXT_PUBLIC_USE_RESERVATION_UI_V2=true で既定 V2（未設定時は V1）
 */

export function resolveReservationUiMode(uiParam) {
  const p = String(uiParam || "").trim().toLowerCase();
  if (p === "v1") return "v1";
  if (p === "v2") return "v2";
  return null;
}

/** サーバ/クライアント共通。クライアントでは NEXT_PUBLIC_* がバンドルに埋め込まれる */
export function useReservationUiV2(uiParam) {
  const explicit = resolveReservationUiMode(uiParam);
  if (explicit === "v1") return false;
  if (explicit === "v2") return true;
  return String(process.env.NEXT_PUBLIC_USE_RESERVATION_UI_V2 || "").toLowerCase() === "true";
}

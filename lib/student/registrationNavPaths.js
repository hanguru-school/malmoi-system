/**
 * 学生登録フロー: メール・verify リダイレクト用パス（トークン検証ロジックは変更しない）
 */

function envRegistrationUiV2() {
  return String(process.env.NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2 || "").toLowerCase() === "true";
}

/** verify の next に渡す同意画面パス（既定 V2 時は ?ui=v2） */
export function registrationConsentPathWithDefaultUi() {
  if (envRegistrationUiV2()) {
    return "/student/register/consent?ui=v2";
  }
  return "/student/register/consent";
}

/** リダイレクト用: 明示 ui があれば優先 */
export function registrationConsentPathPreservingUi(uiParam) {
  const u = String(uiParam || "").trim().toLowerCase();
  if (u === "v2" || u === "v1") {
    return `/student/register/consent?ui=${u}`;
  }
  return registrationConsentPathWithDefaultUi();
}

/** メール内 verify URL に付与する補助クエリ（next に ui が含まれていても可） */
export function verifyLinkUiQuerySuffix() {
  return envRegistrationUiV2() ? "&ui=v2" : "";
}

/** エラー時の開始画面（error クエリ付き、既定 V2 なら ui=v2） */
export function registrationStartPathWithError(errorCode) {
  const params = new URLSearchParams();
  if (errorCode) params.set("error", String(errorCode));
  if (envRegistrationUiV2()) params.set("ui", "v2");
  const q = params.toString();
  return q ? `/student/register/start?${q}` : "/student/register/start";
}

/** プロフィール画面へ（同意後）。ui は v1|v2 のみ付与 */
export function registrationProfilePath(registrationUi) {
  const u = String(registrationUi || "").trim().toLowerCase();
  if (u === "v2" || u === "v1") {
    return `/student/register/profile?ui=${u}`;
  }
  if (envRegistrationUiV2()) {
    return "/student/register/profile?ui=v2";
  }
  return "/student/register/profile";
}

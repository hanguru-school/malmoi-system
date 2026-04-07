/**
 * auditLogs から学生登録関連の時刻を抽出（読み取り専用）
 */

const ACTIONS = {
  START: "student.registration_started",
  CONSENT: "student.consent_agreed",
  PROFILE: "student.profile_updated",
};

/**
 * @param {Array<{ action?: string, at?: string, meta?: object }>} logs 新しい順でも可
 * @returns {{ registrationStartedAt: string|null, consentAgreedAt: string|null, profileUpdatedAt: string|null }}
 */
export function pickRegistrationAuditHints(logs) {
  const sorted = [...(logs || [])].sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  const find = (action) => sorted.find((l) => String(l.action || "") === action)?.at || null;
  return {
    registrationStartedAt: find(ACTIONS.START),
    consentAgreedAt: find(ACTIONS.CONSENT),
    profileUpdatedAt: find(ACTIONS.PROFILE),
  };
}

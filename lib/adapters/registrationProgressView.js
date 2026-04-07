/**
 * 管理画面: 学生の登録進捗（読み取り専用・既存 student DTO を入力に）
 */

function stepDoneStart(student) {
  const rs = String(student.registrationStatus || "");
  return (
    ["start_pending_consent", "consent_pending_profile", "completed", "start_pending_profile", "profile_pending_consent"].includes(
      rs
    ) || Boolean(student.createdAt)
  );
}

function stepDoneConsent(student) {
  return String(student.consentStatus || "") === "agreed";
}

function stepDoneProfile(student) {
  return String(student.registrationStatus || "") === "completed";
}

function stepDoneEnrolled(student) {
  return stepDoneProfile(student) && Boolean(student.studentNumber);
}

/**
 * @param {object} [auditHints] pickRegistrationAuditHints の結果
 * @returns {{ steps: Array<{ key: string, label: string, done: boolean, auditAt?: string|null }>, lastUpdated: string|null, auditHints?: object }}
 */
export function buildRegistrationProgressPanelModel(student, auditHints = null) {
  const h = auditHints || {};
  return {
    steps: [
      {
        key: "start",
        label: "登録開始",
        done: stepDoneStart(student),
        auditAt: h.registrationStartedAt || null,
      },
      {
        key: "consent",
        label: "同意完了",
        done: stepDoneConsent(student),
        auditAt: h.consentAgreedAt || null,
      },
      {
        key: "profile",
        label: "基本情報入力完了",
        done: stepDoneProfile(student),
        auditAt: h.profileUpdatedAt || null,
      },
      { key: "enrolled", label: "登録完了", done: stepDoneEnrolled(student), auditAt: null },
    ],
    lastUpdated: student.studentUpdatedAt || student.updatedAt || null,
    auditHints: h,
  };
}

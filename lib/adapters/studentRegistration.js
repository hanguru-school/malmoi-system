/**
 * 学生初回登録: メッセージ・API クライアント・POST ボディ組み立て（既存 API 契約）
 */

export function registrationStartUrlErrorMessage(errorCode) {
  const code = String(errorCode || "").trim();
  if (code === "token_missing") return "認証リンクにトークン情報がありません。もう一度登録を開始してください。";
  if (code === "token_not_found") return "認証リンクが無効です。もう一度登録を開始してください。";
  if (code === "token_used") return "この認証リンクはすでに使用されています。もう一度登録を開始してください。";
  if (code === "token_expired") return "認証リンクの有効期限が切れました。もう一度登録を開始してください。";
  if (code) return "認証リンクを確認できませんでした。もう一度登録を開始してください。";
  return "";
}

export async function postStartRegistration(payload) {
  const response = await fetch("/api/auth/start-registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    const err = new Error(
      data?.error ||
        "確認メールの送信に失敗しました。\n通信状況をご確認のうえ、もう一度お試しください。"
    );
    err.status = response.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function postStudentConsentAgree() {
  const response = await fetch("/api/student/consent", { method: "POST" });
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "同意処理に失敗しました。");
  }
  return data;
}

/**
 * POST /api/student/profile 用ボディ（ProfileForm と同一キー）
 */
export function buildStudentProfileSubmitPayload(fields) {
  return {
    nameKanji: fields.nameKanji,
    nameFurigana: fields.nameFurigana,
    nameKorean: fields.nameKorean,
    addressLine1: fields.addressLine1,
    addressLine2: fields.addressLine2,
    postalCode: fields.postalCode,
    birthDate: fields.birthDate,
    phoneMobile: fields.phoneMobile,
    phoneEmergency: fields.phoneEmergency,
    emergencyContactName: fields.emergencyContactName,
    emergencyContactNameFurigana: fields.emergencyContactNameFurigana,
    emergencyContactRelation: fields.emergencyContactRelation,
    email: fields.email,
    notes: fields.notes,
  };
}

export async function postStudentProfileComplete(payload) {
  const response = await fetch("/api/student/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "個人情報の保存に失敗しました。");
  }
  return data;
}

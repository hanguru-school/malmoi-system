"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../student.module.css";
import ProfilePhotoModal from "./ProfilePhotoModal";
import StudentLessonTimeFlow from "../StudentLessonTimeFlow";
import {
  DEFAULT_BIRTH_DATE,
  EMERGENCY_RELATION_PRESETS,
  displayEmergencyRelation,
  emergencyRelationToStore,
  formatPhoneInput,
  parseEmergencyRelation,
} from "./profileFormUtils";

function valueOrDash(value) {
  const text = String(value || "").trim();
  return text || "-";
}

const PROFILE_SECTIONS = [
  {
    title: "プロフィール",
    fields: [
      { key: "nameKanji", label: "漢字氏名" },
      { key: "nameFurigana", label: "よみがな" },
      { key: "nameKorean", label: "ハングル" },
      { key: "birthDate", label: "生年月日" },
    ],
  },
  {
    title: "連絡先",
    fields: [
      { key: "phoneMobile", label: "電話番号" },
      { key: "email", label: "メールアドレス", readOnly: true },
    ],
  },
  {
    title: "住所",
    fields: [
      { key: "postalCode", label: "郵便番号" },
      { key: "addressLine1", label: "住所1" },
      { key: "addressLine2", label: "住所2" },
    ],
  },
  {
    title: "緊急連絡先",
    fields: [
      { key: "phoneEmergency", label: "緊急連絡先" },
      { key: "emergencyContactName", label: "緊急連絡先の氏名（漢字）" },
      { key: "emergencyContactNameFurigana", label: "緊急連絡先の氏名（ふりがな）" },
      { key: "emergencyContactRelation", label: "続柄" },
    ],
  },
];

const EDIT_FIELD_DEFS = PROFILE_SECTIONS.flatMap((section) => section.fields);

function buildProfilePayloadFromForm(form) {
  return {
    nameKanji: form.nameKanji,
    nameFurigana: form.nameFurigana,
    nameKorean: form.nameKorean,
    birthDate: form.birthDate,
    phoneMobile: form.phoneMobile,
    phoneEmergency: form.phoneEmergency,
    emergencyContactName: form.emergencyContactName,
    emergencyContactNameFurigana: form.emergencyContactNameFurigana,
    emergencyContactRelation: emergencyRelationToStore(form.emergencyRelationPreset, form.emergencyRelationOther),
    postalCode: form.postalCode,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
  };
}

export default function StudentProfilePanel({ session, student, lessonMinutesPreview = null }) {
  const router = useRouter();
  const profile = student?.crmProfile || {};
  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: "", text: "" });
  const [form, setForm] = useState(() => {
    const parsed = parseEmergencyRelation(
      profile?.emergencyContactRelation,
      profile?.emergencyContactName,
      profile?.emergencyContactNameFurigana
    );
    return {
      nameKanji: student?.nameKanji || "",
      nameFurigana: student?.nameFurigana || "",
      nameKorean: profile?.nameKorean || "",
      birthDate: profile?.birthDate || student?.birthDate || "",
      phoneMobile: formatPhoneInput(profile?.phoneMobile || student?.phone || ""),
      email: session?.user?.email || "",
      phoneEmergency: formatPhoneInput(profile?.phoneEmergency || ""),
      emergencyContactName: parsed.nameKanji,
      emergencyContactNameFurigana: parsed.nameFurigana,
      emergencyContactRelation: profile?.emergencyContactRelation || "",
      emergencyRelationPreset: parsed.preset,
      emergencyRelationOther: parsed.otherText,
      postalCode: profile?.postalCode || "",
      addressLine1: profile?.addressLine1 || student?.address || "",
      addressLine2: profile?.addressLine2 || "",
    };
  });

  const [avatarSrc, setAvatarSrc] = useState(() =>
    String(student?.profileImage || student?.crmProfile?.profileImageDataUrl || "").trim()
  );
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setAvatarSrc(String(student?.profileImage || student?.crmProfile?.profileImageDataUrl || "").trim());
  }, [student?.profileImage, student?.crmProfile?.profileImageDataUrl]);

  useEffect(() => {
    if (isEdit) return;
    const p = student?.crmProfile || {};
    const parsed = parseEmergencyRelation(
      p?.emergencyContactRelation,
      p?.emergencyContactName,
      p?.emergencyContactNameFurigana
    );
    setForm({
      nameKanji: student?.nameKanji || "",
      nameFurigana: student?.nameFurigana || "",
      nameKorean: p?.nameKorean || "",
      birthDate: p?.birthDate || student?.birthDate || "",
      phoneMobile: formatPhoneInput(p?.phoneMobile || student?.phone || ""),
      email: session?.user?.email || "",
      phoneEmergency: formatPhoneInput(p?.phoneEmergency || ""),
      emergencyContactName: parsed.nameKanji,
      emergencyContactNameFurigana: parsed.nameFurigana,
      emergencyContactRelation: p?.emergencyContactRelation || "",
      emergencyRelationPreset: parsed.preset,
      emergencyRelationOther: parsed.otherText,
      postalCode: p?.postalCode || "",
      addressLine1: p?.addressLine1 || student?.address || "",
      addressLine2: p?.addressLine2 || "",
    });
  }, [student, session?.user?.email, isEdit]);

  const minutes = student?.lessonMinutes || {};
  const points = student?.points || {};
  const pairInfo = student?.pairInfo || null;

  const displayRows = useMemo(
    () =>
      PROFILE_SECTIONS.map((section) => ({
        title: section.title,
        rows: section.fields.map((field) => ({
          ...field,
          value:
            field.key === "emergencyContactRelation"
              ? displayEmergencyRelation(form.emergencyContactRelation)
              : field.key === "phoneMobile" || field.key === "phoneEmergency"
                ? formatPhoneInput(form[field.key])
                : form[field.key],
        })),
      })),
    [form]
  );

  function onAvatarClick() {
    if (avatarSrc) {
      setLightboxOpen(true);
    } else {
      setPhotoModalOpen(true);
    }
  }

  const handleSavePhoto = useCallback(
    async (dataUrl) => {
      setPhotoSaving(true);
      setStatus({ type: "", text: "" });
      try {
        const response = await fetch("/api/student/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...buildProfilePayloadFromForm(form),
            profileImageDataUrl: dataUrl,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "プロフィール写真の保存に失敗しました。");
        }
        const next = String(data.student?.crmProfile?.profileImageDataUrl || dataUrl || "").trim();
        setAvatarSrc(next);
        setPhotoModalOpen(false);
        setStatus({ type: "ok", text: "プロフィール写真を保存しました。" });
        router.refresh();
      } catch (error) {
        setStatus({ type: "error", text: error.message || "保存中にエラーが発生しました。" });
      } finally {
        setPhotoSaving(false);
      }
    },
    [form, router]
  );

  async function onSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildProfilePayloadFromForm(form)),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "個人情報の保存に失敗しました。");
      }

      setIsEdit(false);
      setStatus({ type: "ok", text: "個人情報を更新しました。" });
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存中にエラーが発生しました。" });
    } finally {
      setIsSaving(false);
    }
  }

  async function onChangePassword(event) {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
          requireCurrentPassword: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "パスワード変更に失敗しました。");
      setPasswordStatus({ type: "ok", text: "パスワードを変更しました。" });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordStatus({ type: "error", text: error.message || "変更中にエラーが発生しました。" });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <>
      <section className={styles.profileOverviewCard}>
        <p className={styles.profileOverviewEyebrow}>プロフィール</p>
        <div className={styles.profileOverviewTop}>
          <button type="button" className={styles.profileAvatarButton} onClick={onAvatarClick} aria-label={avatarSrc ? "写真を拡大表示" : "写真を追加"}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL
              <img className={styles.profileAvatarImage} src={avatarSrc} alt="" width={96} height={96} />
            ) : (
              <span className={styles.profileAvatarPlus}>+</span>
            )}
          </button>
          <div className={styles.profileOverviewHeroText}>
            <p className={styles.profileOverviewName}>{student?.nameKanji || session?.user?.displayName || "—"}</p>
            <p className={styles.profileOverviewMeta}>会員番号 {student?.studentNumber || "-"}</p>
          </div>
        </div>
        <button type="button" className={styles.profileImageChangeButton} onClick={() => setPhotoModalOpen(true)}>
          写真を変更
        </button>

        <StudentLessonTimeFlow
          variant="profile"
          totalMinutes={minutes.totalMinutes ?? 0}
          usedMinutes={minutes.usedMinutes ?? 0}
          remainingMinutes={minutes.remainingMinutes ?? 0}
          pointsBalance={points.balance ?? 0}
          pointConvertedMinutes={student?.pointConvertedMinutes ?? 0}
        />
        {lessonMinutesPreview?.completionHintJa ? (
          <p
            className={styles.profileLessonMinutesHint}
            data-tone={lessonMinutesPreview.nextCompletionInsufficient ? "warn" : "info"}
          >
            {lessonMinutesPreview.completionHintJa}
          </p>
        ) : null}
        {lessonMinutesPreview?.projectedRemainingHintJa ? (
          <p className={styles.profileLessonMinutesHint} data-tone="info">
            {lessonMinutesPreview.projectedRemainingHintJa}
          </p>
        ) : null}
      </section>

      <ProfilePhotoModal open={photoModalOpen} onClose={() => setPhotoModalOpen(false)} onSave={handleSavePhoto} saving={photoSaving} />

      {lightboxOpen && avatarSrc ? (
        <div
          className={styles.photoLightboxOverlay}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          <button type="button" className={styles.photoLightboxClose} onClick={() => setLightboxOpen(false)} aria-label="閉じる">
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.photoLightboxImg} src={avatarSrc} alt="プロフィール写真（拡大）" />
        </div>
      ) : null}

      <section className={styles.profileInfoCard}>
        <h2 className={styles.sectionTitle}>個人情報</h2>
        <p className={styles.subtitle}>会員番号: {student?.studentNumber || "-"}</p>

        {!isEdit ? (
          <div className={styles.profileList}>
            {displayRows.map((section) => (
              <div key={section.title} className={styles.infoCardPair}>
                <p className={styles.summaryLabel}>{section.title}</p>
                {section.rows.map((row) => (
                  <div key={row.key} className={styles.profileRow}>
                    <span className={styles.profileLabel}>{row.label}</span>
                    <span className={styles.profileValue}>{valueOrDash(row.value)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className={styles.infoCardPair}>
              <p className={styles.summaryLabel}>ペア情報</p>
              {pairInfo?.partner ? (
                <>
                  <p className={styles.profileValue}>ペア相手: {pairInfo.partner.nameKanji || "-"}</p>
                  <p className={styles.profileValue}>会員番号: {pairInfo.partner.studentNumber || "-"}</p>
                  <p className={styles.profileValue}>状態: {pairInfo.status === "active" ? "有効" : "解除済み"}</p>
                </>
              ) : (
                <p className={styles.profileValue}>現在ペアは設定されていません。</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={onSave} data-profile-edit="emergency-v2-kanji-relation-select">
            {EDIT_FIELD_DEFS.map((field) => {
              if (field.key === "emergencyContactNameFurigana") {
                return null;
              }

              if (field.key === "emergencyContactName") {
                return (
                  <div key="emergency-contact-names" className={styles.profileFormLabelGroup}>
                    <label className={styles.profileFormLabel}>
                      緊急連絡先の氏名（漢字）
                      <input
                        className={styles.profileField}
                        type="text"
                        value={form.emergencyContactName}
                        onChange={(e) => setForm((prev) => ({ ...prev, emergencyContactName: e.target.value }))}
                        autoComplete="name"
                      />
                    </label>
                    <label className={styles.profileFormLabel}>
                      緊急連絡先の氏名（ふりがな）
                      <input
                        className={styles.profileField}
                        type="text"
                        value={form.emergencyContactNameFurigana}
                        onChange={(e) => setForm((prev) => ({ ...prev, emergencyContactNameFurigana: e.target.value }))}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                );
              }

              if (field.key === "emergencyContactRelation") {
                return (
                  <div key={field.key} className={styles.profileFormLabel}>
                    {field.label}
                    <select
                      className={styles.profileField}
                      value={form.emergencyRelationPreset || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          emergencyRelationPreset: v,
                          emergencyRelationOther: v === "その他" ? prev.emergencyRelationOther : "",
                        }));
                      }}
                    >
                      <option value="">選択してください</option>
                      {EMERGENCY_RELATION_PRESETS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {form.emergencyRelationPreset === "その他" ? (
                      <label className={styles.profileFormLabelNested}>
                        その他の内容
                        <input
                          className={styles.profileField}
                          type="text"
                          value={form.emergencyRelationOther}
                          onChange={(e) => setForm((prev) => ({ ...prev, emergencyRelationOther: e.target.value }))}
                          placeholder="続柄を具体的に入力"
                          autoComplete="off"
                        />
                      </label>
                    ) : null}
                  </div>
                );
              }

              const isPhone = field.key === "phoneMobile" || field.key === "phoneEmergency";
              const isBirth = field.key === "birthDate";

              return (
                <label key={field.key} className={styles.profileFormLabel}>
                  {field.label}
                  <input
                    className={styles.profileField}
                    type={isBirth ? "date" : "text"}
                    value={
                      isBirth
                        ? form.birthDate || DEFAULT_BIRTH_DATE
                        : isPhone
                          ? form[field.key] || ""
                          : form[field.key] || ""
                    }
                    readOnly={Boolean(field.readOnly)}
                    min={isBirth ? "1900-01-01" : undefined}
                    max={isBirth ? new Date().toISOString().slice(0, 10) : undefined}
                    inputMode={isPhone ? "numeric" : undefined}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      if (isPhone) {
                        setForm((prev) => ({ ...prev, [field.key]: formatPhoneInput(nextValue) }));
                        return;
                      }
                      if (isBirth) {
                        setForm((prev) => ({ ...prev, birthDate: nextValue }));
                        return;
                      }
                      setForm((prev) => ({ ...prev, [field.key]: nextValue }));
                    }}
                  />
                </label>
              );
            })}

            <div className={styles.profileButtonRow}>
              <button type="submit" className={styles.quickCard} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存する"}
              </button>
              <button type="button" className={styles.quickCard} onClick={() => setIsEdit(false)}>
                キャンセル
              </button>
            </div>
          </form>
        )}

        {!isEdit ? (
          <button
            type="button"
            className={styles.quickCard}
            onClick={() => {
              setForm((prev) => {
                const parsed = parseEmergencyRelation(
                  prev.emergencyContactRelation,
                  prev.emergencyContactName,
                  prev.emergencyContactNameFurigana
                );
                return {
                  ...prev,
                  birthDate: prev.birthDate || DEFAULT_BIRTH_DATE,
                  phoneMobile: formatPhoneInput(prev.phoneMobile),
                  phoneEmergency: formatPhoneInput(prev.phoneEmergency),
                  emergencyRelationPreset: parsed.preset,
                  emergencyRelationOther: parsed.otherText,
                };
              });
              setIsEdit(true);
            }}
          >
            修正する
          </button>
        ) : null}

        {status.text ? (
          <p className={status.type === "error" ? `${styles.inlineError}` : styles.inlineSuccess}>{status.text}</p>
        ) : null}
      </section>

      <section className={styles.profileInfoCard}>
        <h2 className={styles.sectionTitle}>パスワード変更</h2>
        <form onSubmit={onChangePassword}>
          <label className={styles.profileFormLabel}>
            現在のパスワード
            <input
              className={styles.profileField}
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              required
            />
          </label>
          <label className={styles.profileFormLabel}>
            新しいパスワード
            <input
              className={styles.profileField}
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              required
            />
          </label>
          <label className={styles.profileFormLabel}>
            新しいパスワード（確認）
            <input
              className={styles.profileField}
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </label>
          <button type="submit" className={styles.quickCard} disabled={passwordSaving}>
            {passwordSaving ? "変更中..." : "変更する"}
          </button>
        </form>
        {passwordStatus.text ? (
          <p className={passwordStatus.type === "error" ? `${styles.inlineError}` : styles.inlineSuccess}>
            {passwordStatus.text}
          </p>
        ) : null}
      </section>
    </>
  );
}

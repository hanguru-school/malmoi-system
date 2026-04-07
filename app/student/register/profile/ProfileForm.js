"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../login/login.module.css";
import {
  shouldChainReservationV2,
  studentMypageHrefAfterRegistration,
  studentReservationHrefFromContext,
} from "../../../../lib/student/postRegistrationNav";
import { rememberReservationUiPreference } from "../../../../lib/student/reservationUiPreference";
import {
  EMERGENCY_RELATION_PRESETS,
  emergencyRelationToStore,
  parseEmergencyRelation,
} from "../../profile/profileFormUtils";
import { buildStudentProfileSubmitPayload, postStudentProfileComplete } from "../../../../lib/adapters/studentRegistration";

export default function ProfileForm({ student, registrationUi }) {
  const router = useRouter();
  const reservationHref = useMemo(() => studentReservationHrefFromContext(registrationUi), [registrationUi]);
  const mypageHref = useMemo(() => studentMypageHrefAfterRegistration(registrationUi), [registrationUi]);
  const profile = student?.crmProfile || {};

  const [addressLine1, setAddressLine1] = useState(profile.addressLine1 || student?.address || "");
  const [addressLine2, setAddressLine2] = useState(profile.addressLine2 || "");
  const [postalCode, setPostalCode] = useState(profile.postalCode || "");
  const [nameKanji, setNameKanji] = useState(student?.nameKanji || "");
  const [nameFurigana, setNameFurigana] = useState(student?.nameFurigana || "");
  const [nameKorean, setNameKorean] = useState(profile.nameKorean || "");
  const [birthDate, setBirthDate] = useState(profile.birthDate || student?.birthDate || "");
  const [phoneMobile, setPhoneMobile] = useState(profile.phoneMobile || student?.phone || "");
  const [phoneEmergency, setPhoneEmergency] = useState(profile.phoneEmergency || "");
  const emergencyInitial = parseEmergencyRelation(
    profile.emergencyContactRelation,
    profile.emergencyContactName,
    profile.emergencyContactNameFurigana
  );
  const [emergencyContactName, setEmergencyContactName] = useState(emergencyInitial.nameKanji);
  const [emergencyContactNameFurigana, setEmergencyContactNameFurigana] = useState(emergencyInitial.nameFurigana);
  const [emergencyRelationPreset, setEmergencyRelationPreset] = useState(emergencyInitial.preset);
  const [emergencyRelationOther, setEmergencyRelationOther] = useState(emergencyInitial.otherText);
  const [email, setEmail] = useState(student?.email || "");
  const [notes, setNotes] = useState(profile.notes || student?.extraInfo || "");

  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });

    try {
      const payload = buildStudentProfileSubmitPayload({
        nameKanji,
        nameFurigana,
        nameKorean,
        addressLine1,
        addressLine2,
        postalCode,
        birthDate,
        phoneMobile,
        phoneEmergency,
        emergencyContactName,
        emergencyContactNameFurigana,
        emergencyContactRelation: emergencyRelationToStore(emergencyRelationPreset, emergencyRelationOther),
        email,
        notes,
      });
      await postStudentProfileComplete(payload);

      if (shouldChainReservationV2(registrationUi)) {
        rememberReservationUiPreference("v2");
      }
      setFinished(true);
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存中にエラーが発生しました。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (finished) {
    return (
      <div className={styles.message} style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
        <p className={styles.sectionTitle} style={{ marginTop: 0 }}>
          登録が完了しました
        </p>
        <p className={styles.description}>次はレッスンを予約できます。マイページからもいつでも移動できます。</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.75rem" }}>
          <Link className={styles.button} href={reservationHref} style={{ textAlign: "center", textDecoration: "none" }}>
            予約へ進む
          </Link>
          <Link
            className={styles.button}
            href={mypageHref}
            style={{ textAlign: "center", textDecoration: "none", background: "#e2e8f0", color: "#334155" }}
          >
            マイページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className={styles.label}>
        漢字氏名
        <input className={styles.field} value={nameKanji} onChange={(e) => setNameKanji(e.target.value)} required />
      </label>
      <label className={styles.label}>
        フリガナ
        <input className={styles.field} value={nameFurigana} onChange={(e) => setNameFurigana(e.target.value)} required />
      </label>
      <label className={styles.label}>
        ハングル名
        <input className={styles.field} value={nameKorean} onChange={(e) => setNameKorean(e.target.value)} />
      </label>
      <label className={styles.label}>
        メール
        <input className={styles.field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className={styles.label}>
        住所 1
        <input className={styles.field} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
      </label>
      <label className={styles.label}>
        住所 2
        <input className={styles.field} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
      </label>
      <label className={styles.label}>
        郵便番号
        <input className={styles.field} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
      </label>
      <label className={styles.label}>
        生年月日
        <input className={styles.field} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
      </label>
      <label className={styles.label}>
        携帯電話
        <input className={styles.field} value={phoneMobile} onChange={(e) => setPhoneMobile(e.target.value)} required />
      </label>
      <label className={styles.label}>
        緊急連絡先
        <input className={styles.field} value={phoneEmergency} onChange={(e) => setPhoneEmergency(e.target.value)} />
      </label>
      <label className={styles.label}>
        緊急連絡先の氏名（漢字）
        <input className={styles.field} value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
      </label>
      <label className={styles.label}>
        緊急連絡先の氏名（ふりがな）
        <input
          className={styles.field}
          value={emergencyContactNameFurigana}
          onChange={(e) => setEmergencyContactNameFurigana(e.target.value)}
        />
      </label>
      <label className={styles.label}>
        続柄
        <select
          className={styles.field}
          value={emergencyRelationPreset || ""}
          onChange={(e) => {
            const v = e.target.value;
            setEmergencyRelationPreset(v);
            if (v !== "その他") setEmergencyRelationOther("");
          }}
        >
          <option value="">選択してください</option>
          {EMERGENCY_RELATION_PRESETS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      {emergencyRelationPreset === "その他" ? (
        <label className={styles.label}>
          続柄（その他の内容）
          <input
            className={styles.field}
            value={emergencyRelationOther}
            onChange={(e) => setEmergencyRelationOther(e.target.value)}
            placeholder="続柄を具体的に入力"
          />
        </label>
      ) : null}
      <label className={styles.label}>
        その他メモ
        <input className={styles.field} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <button className={styles.button} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "保存中..." : "登録を完了する"}
      </button>
      {status.text ? <p className={`${styles.message} ${styles.messageError}`}>{status.text}</p> : null}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../login/login.module.css";
import {
  EMERGENCY_RELATION_PRESETS,
  emergencyRelationToStore,
  parseEmergencyRelation,
} from "../../profile/profileFormUtils";

export default function ProfileForm({ student }) {
  const router = useRouter();
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

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "個人情報の保存に失敗しました。");
      }

      router.push("/student");
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存中にエラーが発生しました。" });
    } finally {
      setIsSubmitting(false);
    }
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

"use client";

/**
 * ?t=hours 専用: SystemSettingsPanel を経由せず教室営業ビジュアルだけを確実に表示する。
 * （古いバンドルやタブ同期ずれで JSON/textarea 側が出るのを防ぐ）
 */

import { useState } from "react";
import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import ClassroomOperationsVisual from "./ClassroomOperationsVisual.js";
import { getDayRule } from "../../../../lib/reservations/scheduleVisualShared.js";

export default function ClassroomHoursSettingsClient({
  initialClassroomOperations = {},
  initialSchoolBasic = {},
  adminRank = "ADMIN",
}) {
  const [classroomOperations, setClassroomOperations] = useState(initialClassroomOperations || {});
  const [schoolBasic, setSchoolBasic] = useState(initialSchoolBasic || {});
  const [status, setStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  async function saveClassroomOperations() {
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const fo = schoolBasic.businessHoursStart || "10:00";
      const fc = schoolBasic.businessHoursEnd || "19:00";
      const mon = getDayRule(classroomOperations.weekdayHours || {}, 1, classroomOperations.defaultOpen || fo, classroomOperations.defaultClose || fc);
      const payload = {
        ...classroomOperations,
        defaultOpen: mon.closed ? classroomOperations.defaultOpen || fo : mon.open,
        defaultClose: mon.closed ? classroomOperations.defaultClose || fc : mon.close,
      };
      const response = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "classroomOperations", patch: payload }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "設定保存に失敗しました。");
      // PATCH の result.settings は当該セクション（classroomOperations）オブジェクトそのもの
      setClassroomOperations(data.result?.settings || payload);
      setStatus({ type: "success", text: "営業時間（教室運営）を保存しました。" });
    } catch (e) {
      setStatus({ type: "error", text: e?.message || "保存中にエラーが発生しました。" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={adminStyles.sectionBlock}>
      <p className={adminStyles.smallMuted}>権限: {adminRank}</p>
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>{status.text}</p>
      ) : null}
      <div className={adminStyles.groupBlock}>
        <h3 className={adminStyles.groupTitle}>営業時間（ビジュアル設定）</h3>
        <ClassroomOperationsVisual
          value={classroomOperations}
          schoolBasic={schoolBasic}
          saving={saving}
          onChange={(next) =>
            setClassroomOperations(typeof next === "object" && next ? next : classroomOperations)
          }
          onSave={saveClassroomOperations}
        />
      </div>
    </section>
  );
}

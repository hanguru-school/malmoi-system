"use client";

import { useMemo } from "react";
import { buildRegistrationProgressPanelModel } from "../../../../lib/adapters/registrationProgressView";
import adminStyles from "../../admin.module.css";
import detailStyles from "./student-detail.module.css";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ja-JP");
}

export default function RegistrationProgressPanel({ student, auditHints = null }) {
  const model = useMemo(() => buildRegistrationProgressPanelModel(student, auditHints), [student, auditHints]);

  return (
    <section className={detailStyles.regProgressPanel} aria-label="初回登録の進捗">
      <h3 className={detailStyles.regProgressTitle}>初回登録の進捗</h3>
      <p className={adminStyles.smallMuted} style={{ marginBottom: "0.5rem" }}>
        学生データと auditLogs（該当アクション）を照合しています。
      </p>
      <ol className={detailStyles.regProgressList}>
        {model.steps.map((step) => (
          <li key={step.key} className={detailStyles.regProgressItem}>
            <span className={step.done ? detailStyles.regProgressDone : detailStyles.regProgressPending}>
              {step.done ? "済" : "未"}
            </span>
            <span>
              {step.label}
              {step.auditAt ? (
                <span className={detailStyles.regProgressAudit}>（記録: {formatDateTime(step.auditAt)}）</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      <p className={adminStyles.smallMuted}>
        <strong>最終更新日時（学生）:</strong> {formatDateTime(model.lastUpdated)}
      </p>
    </section>
  );
}

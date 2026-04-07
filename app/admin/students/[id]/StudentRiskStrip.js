import detailStyles from "./student-detail.module.css";

/**
 * @param {{ badges: Array<{ id: string, label: string, tone: string }> }} props
 */
export default function StudentRiskStrip({ badges = [] }) {
  if (!badges || badges.length === 0) return null;
  return (
    <div className={detailStyles.riskStrip} aria-label="学習シグナル">
      <p className={detailStyles.riskStripTitle}>学習シグナル（参考）</p>
      <div className={detailStyles.riskStripRow}>
        {badges.map((b) => (
          <span key={b.id} className={detailStyles.riskBadge} data-tone={b.tone || "info"}>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

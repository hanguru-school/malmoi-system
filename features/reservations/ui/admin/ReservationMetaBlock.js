"use client";

import ui from "./reservation-detail-panel.module.css";

export default function ReservationMetaBlock({ title, rows = [] }) {
  return (
    <section className={ui.block}>
      <h4 className={ui.blockTitle}>{title}</h4>
      <div className={ui.metaGrid}>
        {rows.map((row) => (
          <div key={row.k} style={{ display: "contents" }}>
            <span className={ui.metaKey}>{row.k}</span>
            <span className={ui.metaVal}>{row.v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

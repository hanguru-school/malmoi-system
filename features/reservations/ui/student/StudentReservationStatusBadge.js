"use client";

import { statusMeta } from "../../../../lib/adapters/studentReservationView";
import flow from "./student-reservation-flow.module.css";

export default function StudentReservationStatusBadge({ status, attendanceStatus }) {
  const st = statusMeta(status, attendanceStatus);
  const cls =
    st.tone === "pending"
      ? flow.badgePending
      : st.tone === "confirmed"
        ? flow.badgeConfirmed
        : st.tone === "cancelled"
          ? flow.badgeCancelled
          : st.tone === "completed"
            ? flow.badgeCompleted
            : flow.badgePending;
  return <span className={`${flow.badge} ${cls}`}>{st.label}</span>;
}

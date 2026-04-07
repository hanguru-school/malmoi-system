"use client";

import Link from "next/link";
import spStyles from "./student-payments.module.css";

const FILTERS = [
  { id: "all", label: "全体", href: "/student/payments" },
  { id: "payment", label: "決済のみ", href: "/student/payments?filter=payment" },
  { id: "grant", label: "ポイント付与のみ", href: "/student/payments?filter=grant" },
];

export default function StudentPaymentsFilterBar({ active }) {
  const current = active || "all";
  return (
    <div className={spStyles.filterRow} role="tablist" aria-label="表示切替">
      {FILTERS.map((f) => (
        <Link
          key={f.id}
          href={f.href}
          className={`${spStyles.filterChip} ${current === f.id ? spStyles.filterChipOn : ""}`}
          role="tab"
          aria-selected={current === f.id}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}

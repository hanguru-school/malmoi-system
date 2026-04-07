"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import adminStyles from "../admin.module.css";

/**
 * @param {{ basePath: string, items: { t: string, label: string }[] }} props
 */
export default function SettingsSubNav({ basePath, items }) {
  const sp = useSearchParams();
  const current = String(sp?.get("t") || "").trim() || (items[0]?.t ?? "");

  return (
    <nav className={adminStyles.settingsSubNav} aria-label="設定サブセクション">
      {items.map((item) => {
        const active = current === item.t;
        const href = `${basePath}?t=${encodeURIComponent(item.t)}`;
        return (
          <Link
            key={item.t}
            href={href}
            className={
              active ? `${adminStyles.settingsSubLink} ${adminStyles.settingsSubLinkActive}` : adminStyles.settingsSubLink
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

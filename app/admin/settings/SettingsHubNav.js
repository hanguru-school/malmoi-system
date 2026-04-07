"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import adminStyles from "../admin.module.css";

const LINKS = [
  { href: "/admin/settings/classroom", label: "教室運営" },
  { href: "/admin/settings/reservation-policy", label: "予約ポリシー" },
  { href: "/admin/settings/teacher-schedule", label: "講師スケジュール" },
  { href: "/admin/settings/lesson-services", label: "レッスン・サービス" },
  { href: "/admin/settings/payments-usage", label: "支払い・利用時間" },
  { href: "/admin/settings/notifications", label: "通知" },
  { href: "/admin/settings/accounts", label: "アカウント・権限" },
  { href: "/admin/settings/system", label: "システム・ログ" },
];

export default function SettingsHubNav() {
  const pathname = usePathname() || "";
  return (
    <nav className={adminStyles.settingsHubNav} aria-label="設定セクション">
      {LINKS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? `${adminStyles.settingsHubLink} ${adminStyles.settingsHubLinkActive}` : adminStyles.settingsHubLink}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

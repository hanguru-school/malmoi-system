"use client";

import { usePathname } from "next/navigation";
import payStyles from "./admin.payments.module.css";

const LINKS = [
  { href: "/admin/payments/input", label: "決済入力" },
  { href: "/admin/payments/history", label: "決済履歴" },
  { href: "/admin/payments/settings", label: "決済設定" },
  { href: "/admin/payments/statistics", label: "統計" },
];

function linkActive(href, pathname) {
  const p = pathname || "";
  if (href === "/admin/payments/input") {
    return p === "/admin/payments/input" || p === "/admin/payments";
  }
  return p === href || p.startsWith(`${href}/`);
}

export default function AdminPaymentsSubNav() {
  const pathname = usePathname() || "";
  return (
    <nav className={payStyles.paySubNav} aria-label="決済メニュー">
      {LINKS.map((item) => {
        const active = linkActive(item.href, pathname);
        return (
          <a
            key={item.href}
            href={item.href}
            className={active ? `${payStyles.paySubNavLink} ${payStyles.paySubNavLinkActive}` : payStyles.paySubNavLink}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

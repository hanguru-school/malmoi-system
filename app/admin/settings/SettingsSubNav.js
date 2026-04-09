"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import adminStyles from "../admin.module.css";

function normalizePath(p) {
  return (p || "").replace(/\/$/, "") || "/";
}

function isActiveHref(href, pathname, sp) {
  try {
    const u = new URL(href, "http://local");
    const targetPath = normalizePath(u.pathname);
    const currentPath = normalizePath(pathname);
    if (targetPath !== currentPath) return false;
    const wantT = u.searchParams.get("t");
    if (wantT !== null) {
      const defaultT = currentPath.includes("/school-general") ? "basic" : "";
      const cur = (sp.get("t") || defaultT).toLowerCase();
      return cur === wantT.toLowerCase();
    }
    if (u.searchParams.toString() === "") {
      return currentPath.endsWith("/admin/settings/classroom");
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * @param {{ basePath?: string, items: { t?: string, label: string, href?: string }[] }} props
 * - href 付き: クロスページナビ（教室運営ハブ）
 * - basePath + t: 従来どおり同一ページ内
 */
export default function SettingsSubNav({ basePath, items = [] }) {
  const pathname = usePathname() || "";
  const sp = useSearchParams();
  const hrefMode = items.length > 0 && items[0]?.href != null;

  if (hrefMode) {
    return (
      <nav className={adminStyles.settingsSubNav} aria-label="設定サブセクション">
        {items.map((item) => {
          const active = isActiveHref(item.href, pathname, sp);
          return (
            <Link
              key={item.href}
              href={item.href}
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

  const current =
    String(sp?.get("t") || "")
      .trim()
      .toLowerCase() || (items[0]?.t ?? "");

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

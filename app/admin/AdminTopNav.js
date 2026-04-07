"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

/**
 * 運用頻度: 上ほど日次。監査・保存診断・アカウント設定は下。
 * 同一 href の項目は key で区別（登録状況は学生一覧の入口として明示）。
 */
const NAV_GROUPS = [
  {
    id: "ops",
    label: "運用",
    items: [
      { key: "opsToday", href: "/admin/ops-today", label: "本日の未処理" },
      { key: "students", href: "/admin/students", label: "学生管理" },
      { key: "studentsAtRisk", href: "/admin/students/at-risk", label: "要フォロー学生" },
      { key: "reservations", href: "/admin/reservations", label: "予約管理" },
      { key: "registration", href: "/admin/students", label: "登録状況" },
      { key: "notices", href: "/admin/notices", label: "お知らせ" },
      { key: "dash", href: "/admin", label: "ダッシュボード" },
      { key: "notes", href: "/admin/lesson-notes", label: "レッスンノート" },
      { key: "hw", href: "/admin/homework", label: "宿題管理" },
      { key: "mail", href: "/admin/mail", label: "メール管理" },
      { key: "parents", href: "/admin/parents", label: "保護者管理" },
    ],
  },
  {
    id: "finance",
    label: "決済",
    items: [{ key: "payments", href: "/admin/payments", label: "決済" }],
  },
  {
    id: "config",
    label: "設定・監査",
    items: [
      { key: "settings", href: "/admin/settings/classroom", label: "設定" },
      { key: "adminUsers", href: "/admin/admin-users", label: "アカウント・権限" },
      { key: "audit", href: "/admin#admin-recent-audit", label: "監査ログ（直近）" },
      { key: "dbcheck", href: "/admin/system/db-check", label: "保存診断" },
    ],
  },
];

const FLAT_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function isNavActive(currentPath, href) {
  if (!href || !currentPath) return false;
  if (href.includes("#")) return false;
  if (currentPath === href) return true;
  if (href === "/admin/payments" && currentPath.startsWith("/admin/payments")) return true;
  if (href === "/admin/students/at-risk" && currentPath.startsWith("/admin/students/at-risk")) return true;
  if (
    href === "/admin/students" &&
    currentPath.startsWith("/admin/students") &&
    !currentPath.startsWith("/admin/students/at-risk")
  )
    return true;
  if (href === "/admin/reservations" && currentPath.startsWith("/admin/reservations")) return true;
  if (
    href === "/admin/settings/classroom" &&
    (currentPath.startsWith("/admin/settings") || currentPath.startsWith("/admin/admin-users"))
  )
    return true;
  if (href === "/admin/lesson-notes" && currentPath.startsWith("/admin/lesson-notes")) return true;
  if (href === "/admin/homework" && currentPath.startsWith("/admin/homework")) return true;
  if (href === "/admin/notices" && currentPath.startsWith("/admin/notices")) return true;
  if (href === "/admin/mail" && currentPath.startsWith("/admin/mail")) return true;
  if (href === "/admin/parents" && currentPath.startsWith("/admin/parents")) return true;
  if (href === "/admin/system/db-check" && currentPath.startsWith("/admin/system/db-check")) return true;
  if (href === "/admin/admin-users" && currentPath.startsWith("/admin/admin-users")) return true;
  if (href === "/admin/ops-today" && currentPath.startsWith("/admin/ops-today")) return true;
  return false;
}

export default function AdminTopNav({ currentPath = "/admin", showPageTitle = false, pageTitle = "" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.navWrap}>
      <div className={styles.navTopLine}>
        <div className={styles.navMobileHeader}>
          <button
            type="button"
            className={styles.navToggleButton}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-menu"
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {showPageTitle ? (
          <div className={styles.navTitleGroup}>
            <h1 className={styles.navPageTitle}>
              {pageTitle ||
                (currentPath === "/admin" ? "管理ダッシュボード" : FLAT_ITEMS.find((item) => isNavActive(currentPath, item.href))?.label || "管理")}
            </h1>
          </div>
        ) : null}
      </div>

      <nav className={styles.navBar} aria-label="admin menu">
        {FLAT_ITEMS.map((item) => {
          const active = isNavActive(currentPath, item.href);
          return (
            <a
              key={item.key}
              className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
              href={item.href}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {menuOpen ? (
        <nav id="admin-mobile-menu" className={styles.navDrawer} aria-label="admin mobile menu">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className={styles.navDrawerGroup}>
              <p className={styles.navDrawerGroupLabel}>{group.label}</p>
              {group.items.map((item) => {
                const active = isNavActive(currentPath, item.href);
                return (
                  <a
                    key={item.key}
                    className={active ? `${styles.navDrawerItem} ${styles.navDrawerItemActive}` : styles.navDrawerItem}
                    href={item.href}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          ))}
          <div className={styles.navDrawerLogout}>
            <button type="button" className={styles.navDrawerLogoutButton} onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

const ITEMS = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/students", label: "学生管理" },
  { href: "/admin/reservations", label: "予約管理" },
  { href: "/admin/lesson-notes", label: "レッスンノート" },
  { href: "/admin/homework", label: "宿題管理" },
  { href: "/admin/parents", label: "保護者管理" },
  { href: "/admin/notices", label: "お知らせ" },
  { href: "/admin/mail", label: "メール管理" },
  { href: "/admin/settings", label: "システム設定" },
  { href: "/admin/system/db-check", label: "保存診断" },
  { href: "/admin/admin-users", label: "管理者設定" },
];

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
              {pageTitle || (currentPath === "/admin" ? "管理ダッシュボード" : ITEMS.find((item) => item.href === currentPath)?.label || "管理")}
            </h1>
          </div>
        ) : null}
      </div>

      <nav className={styles.navBar} aria-label="admin menu">
        {ITEMS.map((item) => {
          const active = currentPath === item.href;
          return (
            <a
              key={item.href}
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
          {ITEMS.map((item) => {
            const active = currentPath === item.href;
            return (
              <a
                key={`mobile-${item.href}`}
                className={active ? `${styles.navDrawerItem} ${styles.navDrawerItemActive}` : styles.navDrawerItem}
                href={item.href}
              >
                {item.label}
              </a>
            );
          })}
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


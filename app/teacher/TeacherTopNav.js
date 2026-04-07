"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin/admin.module.css";

/** ia-teacher-minimal: 授業進行・記録中心 */
const ITEMS = [
  { key: "home", href: "/teacher", label: "ホーム" },
  { key: "today", href: "/teacher/today", label: "今日のレッスン" },
  { key: "opsToday", href: "/teacher/ops-today", label: "本日の未処理" },
  { key: "schedule", href: "/teacher/schedule", label: "予約一覧" },
  { key: "availability", href: "/teacher/availability", label: "担当可能時間" },
  { key: "notes", href: "/teacher/lesson-notes", label: "レッスンノート" },
  { key: "students", href: "/teacher/students", label: "生徒メモ" },
  { key: "notices", href: "/teacher/notices", label: "お知らせ" },
];

function teacherNavActive(currentPath, href) {
  const path = String(currentPath || "").trim();
  const h = String(href || "").trim();
  if (h.includes("#")) return false;
  return path === h;
}

export default function TeacherTopNav({ currentPath = "/teacher" }) {
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
      <div className={styles.navMobileHeader}>
        <button
          type="button"
          className={styles.navToggleButton}
          aria-expanded={menuOpen}
          aria-controls="teacher-mobile-menu"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <nav className={styles.navBar} aria-label="teacher menu">
        {ITEMS.map((item) => {
          const active = teacherNavActive(currentPath, item.href);
          return (
            <a
              key={item.key}
              href={item.href}
              className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {menuOpen ? (
        <nav id="teacher-mobile-menu" className={styles.navDrawer} aria-label="teacher mobile menu">
          {ITEMS.map((item) => {
            const active = teacherNavActive(currentPath, item.href);
            return (
              <a
                key={`drawer-${item.key}`}
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin/admin.module.css";

const ITEMS = [
  { href: "/teacher", label: "ホーム" },
  { href: "/teacher/lessons", label: "本日のレッスン" },
  { href: "/teacher/lesson-notes", label: "レッスンノート" },
  { href: "/teacher/homework", label: "宿題" },
  { href: "/teacher/students", label: "学生検索" },
];

export default function TeacherTopNav({ currentPath = "/teacher" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "teacher" }),
    });
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
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <nav className={styles.navBar} aria-label="teacher menu">
        {ITEMS.map((item) => {
          const active = currentPath === item.href;
          return (
            <a
              key={item.href}
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

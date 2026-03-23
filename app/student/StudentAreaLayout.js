"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "../login/next/LogoutButton";
import styles from "./student.module.css";

export default function StudentAreaLayout({ title, subtitle = "", children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="メニュー"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            ☰
          </button>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
        </header>

        {menuOpen ? (
          <nav className={styles.menuPanel}>
            <Link className={styles.menuItem} href="/student">ホーム</Link>
            <Link className={styles.menuItem} href="/student/reservations">予約</Link>
            <Link className={styles.menuItem} href="/student/payments">決済履歴</Link>
            <Link className={styles.menuItem} href="/student/lesson-notes">レッスンノート</Link>
            <Link className={styles.menuItem} href="/student/homework">宿題</Link>
            <Link className={styles.menuItem} href="/student/progress">学習状況</Link>
            <Link className={styles.menuItem} href="/student/notices">お知らせ</Link>
            <Link className={styles.menuItem} href="/student/profile">個人情報</Link>
            <div className={styles.menuLogout}>
              <LogoutButton role="student" />
            </div>
          </nav>
        ) : null}

        {children}
      </main>
    </div>
  );
}

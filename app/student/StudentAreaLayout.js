"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LogoutButton from "../login/next/LogoutButton";
import {
  rememberReservationUiPreference,
  studentReservationsPathFromBrowserPreference,
} from "../../lib/student/reservationUiPreference";
import styles from "./student.module.css";

export default function StudentAreaLayout({ title, subtitle = "", children }) {
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reservationsMenuHref, setReservationsMenuHref] = useState("/student/reservations");

  useEffect(() => {
    const r = searchParams.get("resUi");
    if (r === "v2" || r === "v1") {
      rememberReservationUiPreference(r);
    }
    setReservationsMenuHref(studentReservationsPathFromBrowserPreference());
  }, [searchParams]);

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
            <Link className={styles.menuItem} href={reservationsMenuHref}>
              予約（予約する・一覧）
            </Link>
            <Link className={styles.menuItem} href="/student/lesson-notes">レッスンノート</Link>
            <Link className={styles.menuItem} href="/student/homework">宿題</Link>
            <Link className={styles.menuItem} href="/student/notices">お知らせ</Link>
            <Link className={styles.menuItem} href="/student/lesson-time">レッスン時間・履歴</Link>
            <Link className={styles.menuItem} href="/student/profile">プロフィール</Link>
            <Link className={styles.menuItem} href="/student/progress">学習状況</Link>
            <div className={styles.menuLogout}>
              <LogoutButton />
            </div>
          </nav>
        ) : null}

        {children}
      </main>
    </div>
  );
}

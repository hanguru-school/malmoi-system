"use client";

import { useRouter } from "next/navigation";
import styles from "../login.module.css";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className={styles.button} type="button" onClick={handleLogout}>
      ログアウト
    </button>
  );
}

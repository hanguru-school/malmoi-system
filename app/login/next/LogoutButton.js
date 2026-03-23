"use client";

import { useRouter } from "next/navigation";
import styles from "../login.module.css";

export default function LogoutButton({ role = null }) {
  const router = useRouter();

  async function handleLogout() {
    const normalizedRole = String(role || "").trim().toLowerCase();
    const hasRole = Boolean(normalizedRole);
    await fetch("/api/auth/logout", {
      method: "POST",
      ...(hasRole
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: normalizedRole }),
          }
        : {}),
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className={styles.button} type="button" onClick={handleLogout}>
      ログアウト
    </button>
  );
}

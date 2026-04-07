import adminStyles from "../admin.module.css";
import styles from "../../login/login.module.css";
import { requireRole } from "../../../lib/auth/session";
import SettingsAdminNav from "./SettingsAdminNav";
import SettingsHubNav from "./SettingsHubNav";
import Link from "next/link";

export default async function AdminSettingsLayout({ children }) {
  await requireRole(["admin"]);
  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>設定</h1>
        <p className={styles.description}>
          教室運営・予約・講師・レッスン・支払い方針・通知・アカウントを「設定」から一元管理します。取引の実務は{" "}
          <Link href="/admin/payments">決済管理</Link> をご利用ください。
        </p>
        <SettingsAdminNav />
        <SettingsHubNav />
        {children}
      </main>
    </div>
  );
}

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
          教室運営・予約・講師日程・通知・アカウントをまとめて管理します。決済設定は{" "}
          <Link href="/admin/payments/settings">決済設定</Link> から開けます。
        </p>
        <SettingsAdminNav />
        <SettingsHubNav />
        {children}
      </main>
    </div>
  );
}

import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listAdminUsersForAdmin } from "../../../lib/auth/store";
import AdminTopNav from "../AdminTopNav";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const admins = await listAdminUsersForAdmin();

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>管理者設定</h1>
        <p className={styles.description}>
          管理者アカウントの権限階層(SUPER_ADMIN / ADMIN)と稼働状態を確認します。
        </p>
        <AdminTopNav currentPath="/admin/admin-users" />
        <div className={styles.links}>
          {admins.map((admin) => (
            <div key={admin.id} className={styles.infoCard}>
              <p>{admin.displayName || "-"}</p>
              <p>メール: {admin.email}</p>
              <p>電話: {admin.phone || "-"}</p>
              <p>権限: {admin.adminRank || "ADMIN"}</p>
              <p>状態: {admin.status || "active"}</p>
              <p>最終ログイン: {admin.lastLoginAt || "-"}</p>
            </div>
          ))}
          {admins.length === 0 ? <p>管理者アカウントがありません。</p> : null}
        </div>
      </main>
    </div>
  );
}


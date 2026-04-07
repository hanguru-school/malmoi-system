import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listAdminUsersForAdmin, listRoleInvitationsForAdmin } from "../../../lib/auth/store";
import AdminTopNav from "../AdminTopNav";
import AdminAccountPermissionsClient from "./AdminAccountPermissionsClient";

export default async function AdminUsersPage() {
  const session = await requireRole(["admin"]);
  const [admins, invites] = await Promise.all([listAdminUsersForAdmin(), listRoleInvitationsForAdmin()]);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>アカウント・権限</h1>
        <div className={adminStyles.accountPageLead}>
          <p className={styles.description}>
            管理者ごとに、表示名・連絡先・役職、システム上の権限と利用状態、ならびにメールや通知に載せる発信者情報（顔写真・署名）をまとめて管理します。
          </p>
          <p className={styles.description}>
            複数アカウントがある場合は、それぞれのブロックで個別に編集し、「保存」で確定してください。学生の本登録や招待メールの流れは、右側の「登録確認」から関連画面へ進められます。
          </p>
        </div>
        <AdminTopNav currentPath="/admin/admin-users" />
        <AdminAccountPermissionsClient
          initialAdmins={admins}
          initialInvites={invites}
          adminRank={session.user.adminRank || "ADMIN"}
        />
      </main>
    </div>
  );
}

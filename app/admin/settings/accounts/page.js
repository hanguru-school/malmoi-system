import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import {
  listAdminUsersForAdmin,
  listRoleInvitationsForAdmin,
} from "../../../../lib/auth/store";
import AdminAccountsSettingsClient from "../AdminAccountsSettingsClient";

export default async function AccountsSettingsPage() {
  const session = await requireRole(["admin"]);
  const [admins, invites] = await Promise.all([listAdminUsersForAdmin(), listRoleInvitationsForAdmin()]);

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        アカウント / 権限
      </h2>
      <p className={styles.description}>管理者プロフィールの編集と、講師・保護者の招待リンク発行です。</p>
      <AdminAccountsSettingsClient
        initialAdmins={admins}
        initialInvites={invites}
        adminRank={session.user.adminRank || "ADMIN"}
      />
    </>
  );
}

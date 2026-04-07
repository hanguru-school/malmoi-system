import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import {
  getSystemInfoSummaryForAdmin,
  getSystemSettingsForAdmin,
  listSystemSettingLogsForAdmin,
} from "../../../../lib/auth/store";
import SystemSettingsPanel from "../SystemSettingsPanel";

export default async function NotificationsSettingsPage() {
  const session = await requireRole(["admin"]);
  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        通知
      </h2>
      <p className={styles.description}>
        ルール追加方式が主です（対象・チャネル・タイミング・テンプレ・変数）。レガシーON/OFFは互換用です。
      </p>
      <SystemSettingsPanel
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["notifications"]}
      />
    </>
  );
}

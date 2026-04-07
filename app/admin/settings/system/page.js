import { Suspense } from "react";
import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import {
  getSystemInfoSummaryForAdmin,
  getSystemSettingsForAdmin,
  listSystemSettingLogsForAdmin,
} from "../../../../lib/auth/store";
import SystemSettingsPanel from "../SystemSettingsPanel";
import SettingsSubNav from "../SettingsSubNav";

const SUB_ITEMS = [
  { t: "mail", label: "メール" },
  { t: "security", label: "セキュリティ" },
  { t: "info", label: "保存診断・システム情報" },
  { t: "logs", label: "変更ログ" },
];

export default async function SystemSettingsSectionPage({ searchParams }) {
  const session = await requireRole(["admin"]);
  const sp = await searchParams;
  const t = String(sp?.t || "mail");
  const tabMap = {
    mail: "mail",
    security: "security",
    info: "systemInfo",
    logs: "changeLogs",
  };
  const initialActiveTab = tabMap[t] || "mail";

  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        システム・ログ
      </h2>
      <p className={styles.description}>メール・セキュリティ・診断・設定変更ログです。</p>
      <Suspense fallback={null}>
        <SettingsSubNav basePath="/admin/settings/system" items={SUB_ITEMS} />
      </Suspense>
      <SystemSettingsPanel
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["mail", "security", "systemInfo", "changeLogs"]}
        initialActiveTab={initialActiveTab}
      />
    </>
  );
}

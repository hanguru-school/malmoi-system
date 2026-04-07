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
  { t: "basic", label: "基本情報" },
  { t: "hours", label: "基本営業・曜日別・日別例外" },
  { t: "pair", label: "ペア設定" },
  { t: "homework", label: "宿題" },
];

export default async function ClassroomSettingsPage({ searchParams }) {
  const session = await requireRole(["admin"]);
  const sp = await searchParams;
  const t = String(sp?.t || "basic");
  const tabMap = {
    basic: "schoolBasic",
    hours: "classroomOperations",
    pair: "pair",
    homework: "homework",
  };
  const initialActiveTab = tabMap[t] || "schoolBasic";

  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        教室運営
      </h2>
      <p className={styles.description}>基本情報・営業時間（優先順位: 日別 &gt; 曜日 &gt; 基本）・ペア・宿題です。</p>
      <Suspense fallback={null}>
        <SettingsSubNav basePath="/admin/settings/classroom" items={SUB_ITEMS} />
      </Suspense>
      <SystemSettingsPanel
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["schoolBasic", "classroomOperations", "pair", "homework"]}
        initialActiveTab={initialActiveTab}
      />
    </>
  );
}

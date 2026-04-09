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
import { CLASSROOM_HUB_SUBNAV } from "../classroomHubNav";

export default async function SchoolGeneralSettingsPage({ searchParams }) {
  const session = await requireRole(["admin"]);
  const sp = await searchParams;
  const t = String(sp?.t || "basic")
    .trim()
    .toLowerCase() || "basic";
  const tabMap = {
    basic: "schoolBasic",
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
        教室運営（基本・ペア・宿題）
      </h2>
      <p className={styles.description}>教室名・連絡先、ペア設定、宿題設定です。営業時間のビジュアル設定は「基本営業」リンク先へ。</p>
      <Suspense fallback={null}>
        <SettingsSubNav items={CLASSROOM_HUB_SUBNAV} />
      </Suspense>
      <SystemSettingsPanel
        key={t}
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["schoolBasic", "pair", "homework"]}
        initialActiveTab={initialActiveTab}
      />
    </>
  );
}

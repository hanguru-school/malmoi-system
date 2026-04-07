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
  { t: "catalog", label: "レッスン一覧・詳細" },
  { t: "common", label: "共通レッスン設定" },
];

export default async function LessonServicesSettingsPage({ searchParams }) {
  const session = await requireRole(["admin"]);
  const sp = await searchParams;
  const t = String(sp?.t || "catalog");
  const tabMap = { catalog: "lessonServiceCatalog", common: "lesson" };
  const initialActiveTab = tabMap[t] || "lessonServiceCatalog";

  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        レッスン・サービス
      </h2>
      <p className={styles.description}>
        名称・説明・画像・個人/ペア/グループ・時間・準備・講師・オンライン/対面・学生選択可否など、商品マスタを管理します。
      </p>
      <Suspense fallback={null}>
        <SettingsSubNav basePath="/admin/settings/lesson-services" items={SUB_ITEMS} />
      </Suspense>
      <SystemSettingsPanel
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["lessonServiceCatalog", "lesson"]}
        initialActiveTab={initialActiveTab}
      />
    </>
  );
}

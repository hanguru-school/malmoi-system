import { Suspense } from "react";
import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import {
  getSystemInfoSummaryForAdmin,
  getSystemSettingsForAdmin,
  listSystemSettingLogsForAdmin,
} from "../../../../lib/auth/store";
import SystemSettingsPanel from "../SystemSettingsPanel";
import AdminTeacherScheduleClient from "../AdminTeacherScheduleClient";
import SettingsSubNav from "../SettingsSubNav";

const SUB_ITEMS = [
  { t: "policy", label: "変更ルール・ロック" },
  { t: "teachers", label: "講師一覧・週次・例外" },
];

export default async function TeacherScheduleSettingsPage({ searchParams }) {
  const session = await requireRole(["admin"]);
  const sp = await searchParams;
  const t = String(sp?.t || "policy");

  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        講師スケジュール
      </h2>
      <p className={styles.description}>
        n日前まで変更、m時間前ロック、管理者限定編集などのポリシーと、講師別の週次可否・例外です。
      </p>
      <Suspense fallback={null}>
        <SettingsSubNav basePath="/admin/settings/teacher-schedule" items={SUB_ITEMS} />
      </Suspense>
      {t === "teachers" ? (
        <AdminTeacherScheduleClient />
      ) : (
        <SystemSettingsPanel
          initialSettings={settings}
          initialSystemInfo={systemInfo}
          initialLogs={logResult.items || []}
          initialLogPagination={logResult.pagination}
          adminRank={session.user.adminRank || "ADMIN"}
          tabIds={["teacherSchedulePolicy"]}
        />
      )}
    </>
  );
}

import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import {
  getSystemInfoSummaryForAdmin,
  getSystemSettingsForAdmin,
  listSystemSettingLogsForAdmin,
} from "../../../../lib/auth/store";
import SystemSettingsPanel from "../SystemSettingsPanel";
import AdminTeacherScheduleClient from "../AdminTeacherScheduleClient";

export default async function TeacherScheduleSettingsPage() {
  const session = await requireRole(["admin"]);
  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        講師日程
      </h2>
      <p className={styles.description}>変更ポリシーと、講師別の週次可否・例外・管理者ロックです。</p>
      <SystemSettingsPanel
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["teacherSchedulePolicy"]}
      />
      <AdminTeacherScheduleClient />
    </>
  );
}

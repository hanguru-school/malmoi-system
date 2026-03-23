import Link from "next/link";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import {
  getSystemInfoSummaryForAdmin,
  getSystemSettingsForAdmin,
  listSystemSettingLogsForAdmin,
} from "../../../lib/auth/store";
import AdminTopNav from "../AdminTopNav";
import SystemSettingsPanel from "./SystemSettingsPanel";

export default async function AdminSettingsPage() {
  const session = await requireRole(["admin"]);
  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>システム設定</h1>
        <p className={styles.description}>教室運営に必要な基準値とポリシーをタブ別に管理します。</p>
        <p className={adminStyles.settingsPaymentHint}>
          <span>決済の登録・売上確認はこちら:</span>
          <Link href="/admin/payments/input">決済入力</Link>
          <span aria-hidden="true">|</span>
          <Link href="/admin/payments/settings">決済設定</Link>
          <span aria-hidden="true">|</span>
          <Link href="/admin/payments/statistics">統計</Link>
        </p>
        <AdminTopNav currentPath="/admin/settings" />
        <SystemSettingsPanel
          initialSettings={settings}
          initialSystemInfo={systemInfo}
          initialLogs={logResult.items || []}
          initialLogPagination={logResult.pagination}
          adminRank={session.user.adminRank || "ADMIN"}
        />
      </main>
    </div>
  );
}


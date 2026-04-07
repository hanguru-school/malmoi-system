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
  { t: "booking", label: "予約受付・変更・表示・承認" },
  { t: "parent", label: "保護者ポリシー" },
];

export default async function ReservationPolicySettingsPage({ searchParams }) {
  const session = await requireRole(["admin"]);
  const sp = await searchParams;
  const t = String(sp?.t || "booking");
  const tabMap = { booking: "reservation", parent: "parent" };
  const initialActiveTab = tabMap[t] || "reservation";

  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        予約ポリシー
      </h2>
      <p className={styles.description}>
        予約モード・キャンセル・カレンダー表示・承認設定（レッスン商品マスタは「レッスン・サービス」）。
      </p>
      <Suspense fallback={null}>
        <SettingsSubNav basePath="/admin/settings/reservation-policy" items={SUB_ITEMS} />
      </Suspense>
      <SystemSettingsPanel
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["reservation", "parent"]}
        initialActiveTab={initialActiveTab}
      />
    </>
  );
}

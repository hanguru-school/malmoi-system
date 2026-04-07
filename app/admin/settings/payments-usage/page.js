import { Suspense } from "react";
import Link from "next/link";
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
  { t: "payment", label: "支払い方法・Web準備" },
  { t: "lesson", label: "利用時間・共通レッスン" },
];

export default async function PaymentsUsageSettingsPage({ searchParams }) {
  const session = await requireRole(["admin"]);
  const sp = await searchParams;
  const t = String(sp?.t || "payment");
  const tabMap = { payment: "paymentMethodsPolicy", lesson: "lesson" };
  const initialActiveTab = tabMap[t] || "paymentMethodsPolicy";

  const settings = await getSystemSettingsForAdmin();
  const systemInfo = await getSystemInfoSummaryForAdmin();
  const logResult = await listSystemSettingLogsForAdmin({ page: 1, pageSize: 20 });

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        支払い・利用時間
      </h2>
      <p className={styles.description}>
        支払い手段の表示方針と、教室決済→利用時間登録のメモです。取引・ポイントの実データは{" "}
        <Link href="/admin/payments">決済管理</Link> から操作してください。
      </p>
      <Suspense fallback={null}>
        <SettingsSubNav basePath="/admin/settings/payments-usage" items={SUB_ITEMS} />
      </Suspense>
      <SystemSettingsPanel
        initialSettings={settings}
        initialSystemInfo={systemInfo}
        initialLogs={logResult.items || []}
        initialLogPagination={logResult.pagination}
        adminRank={session.user.adminRank || "ADMIN"}
        tabIds={["paymentMethodsPolicy", "lesson"]}
        initialActiveTab={initialActiveTab}
      />
    </>
  );
}

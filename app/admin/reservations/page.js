import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listReservationsForAdmin } from "../../../lib/auth/store";
import { useReservationUiV2 } from "../../../lib/ui/featureFlags";
import AdminReservationsPanel from "./AdminReservationsPanel";
import AdminReservationsPanelV2 from "./AdminReservationsPanelV2";
import AdminTopNav from "../AdminTopNav";

export default async function AdminReservationsPage({ searchParams }) {
  await requireRole(["admin"]);
  const query = await searchParams;
  const selectedDate = String(query?.date || "").trim();
  const focus = String(query?.focus || "").trim();
  const selectedStatus = String(query?.status || "").trim();
  const useV2 = useReservationUiV2(query?.ui);
  const defaultDay = new Date().toISOString().slice(0, 10);
  const day = selectedDate || defaultDay;
  const initialFilters = {
    q: "",
    status: selectedStatus,
    lessonMode: "",
    studentId: String(query?.studentId || "").trim(),
    fromDate: day,
    toDate: day,
  };
  const result = await listReservationsForAdmin({ ...initialFilters, page: 1, pageSize: useV2 ? 500 : 300 });

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <AdminTopNav currentPath="/admin/reservations" showPageTitle pageTitle="予約運用" />
        <p className={adminStyles.metaText}>
          {useV2
            ? "日付範囲とフィルターで一覧を確認し、行を選んで詳細操作します。複雑な操作は従来画面へ切り替えてください。"
            : "予約スケジュールを先に確認し、承認待ちを優先的に処理してください。"}
        </p>

        {useV2 ? (
          <AdminReservationsPanelV2
            initialReservations={result.items}
            initialFilters={initialFilters}
            scopeNotice={
              initialFilters.studentId
                ? `学生IDフィルター適用中: ${initialFilters.studentId} (対象学生の予約中心表示)`
                : ""
            }
          />
        ) : (
          <AdminReservationsPanel
            initialReservations={result.items}
            initialFilters={initialFilters}
            initialFocus={focus}
            scopeNotice={
              initialFilters.studentId
                ? `学生IDフィルター適用中: ${initialFilters.studentId} (対象学生の予約中心表示)`
                : ""
            }
          />
        )}
      </main>
    </div>
  );
}

import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listReservationsForAdmin } from "../../../lib/auth/store";
import AdminReservationsPanel from "./AdminReservationsPanel";
import AdminTopNav from "../AdminTopNav";

export default async function AdminReservationsPage({ searchParams }) {
  await requireRole(["admin"]);
  const query = await searchParams;
  const selectedDate = String(query?.date || "").trim();
  const focus = String(query?.focus || "").trim();
  const selectedStatus = String(query?.status || "").trim();
  const initialFilters = {
    q: "",
    status: selectedStatus,
    lessonMode: "",
    studentId: String(query?.studentId || "").trim(),
    fromDate: selectedDate,
    toDate: selectedDate,
  };
  const result = await listReservationsForAdmin({ ...initialFilters, page: 1, pageSize: 300 });

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <AdminTopNav currentPath="/admin/reservations" showPageTitle pageTitle="予約運用" />
        <p className={adminStyles.metaText}>予約スケジュールを先に確認し、承認待ちを優先的に処理してください。</p>

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
      </main>
    </div>
  );
}

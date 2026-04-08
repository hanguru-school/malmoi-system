import { Suspense } from "react";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listReservationsForAdmin } from "../../../lib/auth/store";
import { computeReservationFetchRange } from "../../../lib/admin/reservationCalendarModel.js";
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
  const weekRange = computeReservationFetchRange("week", day);

  const initialFilters = useV2
    ? {
        q: "",
        status: selectedStatus,
        lessonMode: "",
        studentId: String(query?.studentId || "").trim(),
        anchorDate: day,
        fromDate: weekRange.fromDate,
        toDate: weekRange.toDate,
      }
    : {
        q: "",
        status: selectedStatus,
        lessonMode: "",
        studentId: String(query?.studentId || "").trim(),
        fromDate: day,
        toDate: day,
      };

  const result = await listReservationsForAdmin({
    q: initialFilters.q,
    status: initialFilters.status,
    lessonMode: initialFilters.lessonMode,
    studentId: initialFilters.studentId,
    fromDate: initialFilters.fromDate,
    toDate: initialFilters.toDate,
    page: 1,
    pageSize: useV2 ? 500 : 300,
  });

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <AdminTopNav currentPath="/admin/reservations" showPageTitle pageTitle="予約運用" />
        <p className={adminStyles.metaText}>
          {useV2
            ? "上段で基準日と表示形式を整え、すぐ下のカレンダー／一覧で予約を確認します。行や枠を選ぶと右（または下）の詳細から操作できます。"
            : "予約スケジュールを先に確認し、承認待ちを優先的に処理してください。"}
        </p>

        {useV2 ? (
          <Suspense fallback={<p className={adminStyles.metaText}>読み込み中...</p>}>
            <AdminReservationsPanelV2
              initialReservations={result.items}
              initialFilters={initialFilters}
              scopeNotice={
                initialFilters.studentId
                  ? `学生IDフィルター適用中: ${initialFilters.studentId}（取得範囲内の当該学生予約）`
                  : ""
              }
            />
          </Suspense>
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

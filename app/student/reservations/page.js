import { requireRole } from "../../../lib/auth/session";
import { useReservationUiV2 } from "../../../lib/reservations/reservationUiFlags";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentReservationsPanel from "./StudentReservationsPanel";
import StudentReservationsPanelV2 from "./StudentReservationsPanelV2";

export default async function StudentReservationsPage({ searchParams }) {
  await requireRole(["student"]);
  const q = await searchParams;
  const useV2 = useReservationUiV2(q?.ui);

  return (
    <StudentAreaLayout
      title="予約"
      subtitle={
        useV2
          ? "日付と時間を選んで予約し、一覧から変更・キャンセルできます。"
          : "段階ごとに選択しながら予約を作成し、自分の予約を確認・変更できます。"
      }
    >
      {useV2 ? <StudentReservationsPanelV2 /> : <StudentReservationsPanel />}
    </StudentAreaLayout>
  );
}

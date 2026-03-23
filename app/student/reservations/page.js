import { requireRole } from "../../../lib/auth/session";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentReservationsPanel from "./StudentReservationsPanel";

export default async function StudentReservationsPage() {
  await requireRole(["student"]);

  return (
    <StudentAreaLayout
      title="予約"
      subtitle="段階ごとに選択しながら予約を作成し、自分の予約を確認・変更できます。"
    >
      <StudentReservationsPanel />
    </StudentAreaLayout>
  );
}

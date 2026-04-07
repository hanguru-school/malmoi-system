import { requireRole } from "../../../lib/auth/session";
import { listReservationsForStudent } from "../../../lib/auth/store";
import { buildLessonMinutesCompletionPreview } from "../../../lib/adapters/lessonMinutesSummary.js";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentProfilePanel from "./StudentProfilePanel";

function toDateTimeKey(item) {
  return `${item.date || ""}T${item.time || "00:00"}`;
}

/** 常にサーバーで描画し、CDN/ブラウザの古いHTMLキャッシュを避ける */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function StudentProfilePage() {
  const session = await requireRole(["student"]);
  const student = session.student || {};
  let lessonMinutesPreview = null;
  if (session.user?.id) {
    const reservationResult = await listReservationsForStudent(session.user.id, { page: 1, pageSize: 200 });
    const items = reservationResult.items || [];
    const nextReservation =
      items
        .filter((item) => ["requested", "confirmed"].includes(String(item.status || "")))
        .sort((a, b) => new Date(toDateTimeKey(a)).getTime() - new Date(toDateTimeKey(b)).getTime())[0] || null;
    lessonMinutesPreview = buildLessonMinutesCompletionPreview({
      remainingMinutes: student?.lessonMinutes?.remainingMinutes,
      nextReservation,
    });
  }

  return (
    <StudentAreaLayout title="個人情報">
      <StudentProfilePanel session={session} student={student} lessonMinutesPreview={lessonMinutesPreview} />
    </StudentAreaLayout>
  );
}

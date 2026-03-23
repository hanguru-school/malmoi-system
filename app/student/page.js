import { redirect } from "next/navigation";
import { requireRole } from "../../lib/auth/session";
import {
  listHomeworksForStudent,
  listLessonMinuteLogsForStudentPortal,
  listLessonNotesForStudent,
  listNoticesForStudent,
  listPaymentTransactionsForStudent,
  listReservationsForStudent,
} from "../../lib/auth/store";
import { sumReservedMinutesFromReservations } from "../../lib/student/reservationMinutesShared.js";
import StudentDashboard from "./StudentDashboard";
import StudentAreaLayout from "./StudentAreaLayout";

function toDateTimeKey(item) {
  return `${item.date || ""}T${item.time || "00:00"}`;
}

function jstTodayYmd() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export default async function StudentHomePage() {
  const session = await requireRole(["student"]);
  if (!session.student) redirect("/student/register/start");
  if (session.student.registrationStatus !== "completed") {
    if (session.student.registrationStatus === "start_pending_profile") redirect("/student/register/profile");
    redirect("/student/register/consent");
  }

  const reservationResult = await listReservationsForStudent(session.user.id, { page: 1, pageSize: 200 });
  const reservationItems = reservationResult.items || [];
  const reservedMinutesSum = sumReservedMinutesFromReservations(reservationItems);

  const nextReservation =
    reservationItems
      .filter((item) => ["requested", "confirmed"].includes(item.status))
      .sort((a, b) => new Date(toDateTimeKey(a)).getTime() - new Date(toDateTimeKey(b)).getTime())[0] || null;

  const [notices, recentLessonNotes, recentPayments, recentMinuteLogs, homeworkList] = await Promise.all([
    listNoticesForStudent({ limit: 5 }),
    listLessonNotesForStudent(session.user.id),
    listPaymentTransactionsForStudent(session.user.id),
    listLessonMinuteLogsForStudentPortal(session.user.id, 5),
    listHomeworksForStudent(session.user.id),
  ]);

  const todayYmd = jstTodayYmd();
  const todayLessons = (reservationItems || []).filter(
    (item) =>
      String(item.date || "").trim() === todayYmd &&
      ["requested", "confirmed"].includes(String(item.status || ""))
  );

  return (
    <StudentAreaLayout title="ホーム" subtitle="">
      <StudentDashboard
        session={session}
        nextReservation={nextReservation}
        calendarReservations={reservationItems}
        reservedMinutesSum={reservedMinutesSum}
        notices={notices}
        recentLessonNotes={(recentLessonNotes || []).slice(0, 3)}
        homeworkItems={(homeworkList || []).slice(0, 8)}
        todayLessons={todayLessons}
        todayYmd={todayYmd}
        recentPayments={(recentPayments || []).slice(0, 3)}
        recentMinuteLogs={recentMinuteLogs || []}
      />
    </StudentAreaLayout>
  );
}

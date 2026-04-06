import { requireRole } from "../../../lib/auth/session";
import TeacherDayView from "../TeacherDayView";

function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export default async function TeacherSchedulePage({ searchParams }) {
  const session = await requireRole(["teacher"]);
  const q = await searchParams;
  const date = String(q?.date || todayInJst()).trim();
  return (
    <TeacherDayView
      teacherUserId={session.user.id}
      date={date}
      pageTitle="予約一覧"
      pageSubtitle="日付を選んで担当予約を確認します。"
      currentPath="/teacher/schedule"
      showTodayShortcut
    />
  );
}

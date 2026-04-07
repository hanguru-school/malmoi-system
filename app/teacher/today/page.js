import { requireRole } from "../../../lib/auth/session";
import TeacherDayView from "../TeacherDayView";

function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export default async function TeacherTodayPage() {
  const session = await requireRole(["teacher"]);
  const today = todayInJst();
  return (
    <TeacherDayView
      teacherUserId={session.user.id}
      date={today}
      pageTitle="今日のレッスン"
      pageSubtitle="本日の担当枠からレッスンノート・宿題へ進めます。"
      currentPath="/teacher/today"
      showTodayShortcut={false}
    />
  );
}

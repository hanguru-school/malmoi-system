import { redirect } from "next/navigation";

/** 旧URL互換: 今日のレッスンへ */
export default function TeacherLessonsLegacyPage() {
  redirect("/teacher/today");
}

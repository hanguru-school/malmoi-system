import { Suspense } from "react";
import { requireRole } from "../../../lib/auth/session";
import AdminLessonNotesPanel from "../../admin/lesson-notes/AdminLessonNotesPanel";
import TeacherTopNav from "../TeacherTopNav";
import t from "../teacher.module.css";

export default async function TeacherLessonNotesPage({ searchParams }) {
  await requireRole(["teacher"]);
  const sp = await searchParams;
  const initialLessonUnitId = String(sp?.lessonUnitId || "").trim();
  const initialNoteDate = String(sp?.refDate || "").trim();
  const initialStudentIdFilter = String(sp?.studentId || "").trim();
  return (
    <div className={t.shell}>
      <main className={t.main}>
        <h1 className={t.title}>レッスンノート</h1>
        <p className={t.subtitle}>lessonUnitId 基準で作成・修正します。今日のレッスンからもリンクできます。</p>
        <TeacherTopNav currentPath="/teacher/lesson-notes" />
        <Suspense fallback={<p className={t.subtitle}>読み込み中...</p>}>
          <AdminLessonNotesPanel
            apiBasePath="/api/teacher/lesson-notes"
            scopeNotice="担当範囲: 自分が作成したレッスンノートのみ表示・修正・削除できます。"
            showOwnerBadge
            ownerBadgeText="作成者: 自分"
            initialLessonUnitId={initialLessonUnitId}
            initialNoteDate={initialNoteDate}
            initialStudentIdFilter={initialStudentIdFilter}
          />
        </Suspense>
      </main>
    </div>
  );
}

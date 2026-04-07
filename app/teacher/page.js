import Link from "next/link";
import { requireRole } from "../../lib/auth/session";
import {
  listHomeworksForAdmin,
  listLessonNotesForAdmin,
  listNoticesForStudent,
  listReservationsForAdmin,
  listStudentsForTeacherOverview,
} from "../../lib/auth/store";
import LogoutButton from "../login/next/LogoutButton";
import TeacherTopNav from "./TeacherTopNav";
import t from "./teacher.module.css";

function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export default async function TeacherHomePage() {
  const session = await requireRole(["teacher"]);
  const today = todayInJst();
  const [reservationResult, notes, homeworks, students, notices] = await Promise.all([
    listReservationsForAdmin({ page: 1, pageSize: 300, fromDate: today, toDate: today }),
    listLessonNotesForAdmin({ teacherUserId: session.user.id }),
    listHomeworksForAdmin({ teacherUserId: session.user.id }),
    listStudentsForTeacherOverview(),
    listNoticesForStudent({ limit: 5 }),
  ]);

  const reservations = reservationResult.items || [];
  const todaysLessons = reservations.filter(
    (item) => item.instructorUserId === session.user.id && ["requested", "confirmed", "completed"].includes(item.status)
  );

  const completedLessonUnitIds = new Set(
    todaysLessons.filter((item) => item.status === "completed" && item.lessonUnitId).map((item) => item.lessonUnitId)
  );
  const notedLessonUnitIds = new Set((notes || []).filter((item) => item.lessonUnitId).map((item) => item.lessonUnitId));
  const missingNotes = [...completedLessonUnitIds].filter((unitId) => !notedLessonUnitIds.has(unitId)).length;

  const hwKey = (h) => `${String(h.lessonUnitId || "").trim()}|${String(h.studentId || "").trim()}|${String(h.lessonDate || "").slice(0, 10)}`;
  const hwTodaySet = new Set(
    (homeworks || [])
      .filter((h) => String(h.lessonDate || "").slice(0, 10) === today)
      .map(hwKey)
  );
  const completedToday = todaysLessons.filter(
    (item) => item.status === "completed" && item.lessonUnitId && item.studentId
  );
  const missingHomework = completedToday.filter((item) => !hwTodaySet.has(`${item.lessonUnitId}|${item.studentId}|${today}`)).length;

  const submittedHomeworks = (homeworks || []).filter((item) => item.status === "submitted").length;
  const recentNotices = (notices || []).slice(0, 3);

  return (
    <div className={t.shell}>
      <main className={t.main}>
        <h1 className={t.title}>先生ホーム</h1>
        <p className={t.subtitle}>まず「今日やること」を確認し、予約・ノート・宿題へ進んでください。</p>

        <section className={t.todayPriority} aria-label="今日やること">
          <h2 className={t.todayPriorityTitle}>今日やること</h2>
          <div className={t.todayGrid}>
            <article className={t.todayCard}>
              <p className={t.todayCardLab}>本日の担当レッスン</p>
              <p className={t.todayCardKpi}>{todaysLessons.length}</p>
              <Link className={t.todayCardLink} href="/teacher/today">
                今日のレッスンへ
              </Link>
            </article>
            <article className={t.todayCard}>
              <p className={t.todayCardLab}>ノート未作成（完了済み）</p>
              <p className={t.todayCardKpi}>{missingNotes}</p>
              <Link className={t.todayCardLink} href="/teacher/lesson-notes">
                レッスンノートへ
              </Link>
            </article>
            <article className={t.todayCard}>
              <p className={t.todayCardLab}>宿題未登録（本日完了）</p>
              <p className={t.todayCardKpi}>{missingHomework}</p>
              <Link className={t.todayCardLink} href="/teacher/homework">
                宿題管理へ
              </Link>
            </article>
            <article className={t.todayCard}>
              <p className={t.todayCardLab}>提出待ちの宿題（全体）</p>
              <p className={t.todayCardKpi}>{submittedHomeworks}</p>
              <Link className={t.todayCardLink} href="/teacher/homework">
                確認へ
              </Link>
            </article>
            <article className={t.todayCard}>
              <p className={t.todayCardLab}>未処理まとめ</p>
              <p className={t.todayCardKpi} style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e40af" }}>
                一覧
              </p>
              <Link className={t.todayCardLink} href="/teacher/ops-today">
                本日の未処理へ
              </Link>
            </article>
          </div>
          <div className={t.todayNoticeBlock}>
            <p className={t.todayNoticeTitle}>最近のお知らせ</p>
            {recentNotices.length === 0 ? (
              <p className={t.todayNoticeEmpty}>表示できるお知らせはありません。</p>
            ) : (
              <ul className={t.todayNoticeList}>
                {recentNotices.map((n) => (
                  <li key={n.id}>
                    <Link href={`/teacher/notices/${encodeURIComponent(n.id)}`}>{n.title || "お知らせ"}</Link>
                    <span className={t.todayNoticeDate}>
                      {String(n.publishedAt || n.updatedAt || "").slice(0, 10) || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link className={t.todayCardLink} href="/teacher/notices">
              お知らせ一覧へ
            </Link>
          </div>
        </section>

        <TeacherTopNav currentPath="/teacher" />

        <div className={t.quickMenuGrid}>
          <Link className={t.btnNote} href="/teacher/today" style={{ textAlign: "center" }}>
            今日のレッスン
          </Link>
          <Link className={t.btnSub} href="/teacher/schedule" style={{ textAlign: "center" }}>
            予約一覧
          </Link>
          <Link className={t.btnSub} href="/teacher/lesson-notes" style={{ textAlign: "center" }}>
            レッスンノート
          </Link>
          <Link className={t.btnSub} href="/teacher/students" style={{ textAlign: "center" }}>
            生徒メモ
          </Link>
          <Link className={t.btnSub} href="/teacher/notices" style={{ textAlign: "center" }}>
            お知らせ
          </Link>
        </div>

        <div className={t.lessonCard} style={{ marginTop: "1rem" }}>
          <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>補足サマリ</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem", color: "#475569" }}>
            対象学生: {students.length} 名 / 本日完了レッスンで宿題キー未登録: {missingHomework} 件
          </p>
        </div>

        <p style={{ margin: "1rem 0 0", fontSize: "0.88rem", color: "#64748b" }}>
          宿題の確認は <Link href="/teacher/homework">宿題一覧</Link> から。
        </p>

        <div style={{ marginTop: "1.25rem" }}>
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}

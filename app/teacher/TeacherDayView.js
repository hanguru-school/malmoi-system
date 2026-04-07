import Link from "next/link";
import { listReservationsForAdmin } from "../../lib/auth/store";
import TeacherTopNav from "./TeacherTopNav";
import t from "./teacher.module.css";

function statusLabel(status) {
  if (status === "requested") return "予約申請中";
  if (status === "confirmed") return "予約確定";
  if (status === "completed") return "完了";
  if (status === "cancelled") return "キャンセル";
  return status || "-";
}

/**
 * @param {{ teacherUserId: string, date: string, pageTitle: string, pageSubtitle: string, currentPath: string, showTodayShortcut?: boolean }} props
 */
export default async function TeacherDayView({
  teacherUserId,
  date,
  pageTitle,
  pageSubtitle,
  currentPath,
  showTodayShortcut = false,
}) {
  const reservationResult = await listReservationsForAdmin({ page: 1, pageSize: 400, fromDate: date, toDate: date });
  const rows = (reservationResult.items || [])
    .filter((item) => item.instructorUserId === teacherUserId)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return (
    <div className={t.shell}>
      <main className={t.main}>
        <h1 className={t.title}>{pageTitle}</h1>
        <p className={t.subtitle}>{pageSubtitle}</p>
        <TeacherTopNav currentPath={currentPath} />
        <form className={t.dateForm} method="GET">
          <label className={t.dateLabel}>
            日付
            <input className={t.dateInput} type="date" name="date" defaultValue={date} />
          </label>
          <button className={t.btn} type="submit">
            表示
          </button>
          {showTodayShortcut ? (
            <Link className={`${t.btn} ${t.btnSecondary}`} href="/teacher/today" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              今日へ
            </Link>
          ) : null}
        </form>

        <div className={t.lessonList}>
          {rows.map((item) => (
            <article key={item.id} className={t.lessonCard}>
              <div className={t.lessonCardHead}>
                <div>
                  <p className={t.lessonDate}>{item.date}</p>
                  <p className={t.lessonTime}>{item.time} 〜</p>
                </div>
                <span className={t.statusBadge}>{statusLabel(item.status)}</span>
              </div>
              <div className={t.lessonMeta}>
                <p>
                  <strong>学生</strong> {item.studentNameKanji || "—"}
                </p>
                <p>
                  <strong>時間</strong> {item.durationMinutes}分 /{" "}
                  {item.lessonDeliveryType === "online" ? "オンライン" : "対面"}
                </p>
              </div>
              <div className={t.actions}>
                <Link
                  className={t.btnNote}
                  href={`/teacher/lesson-notes?lessonUnitId=${encodeURIComponent(item.lessonUnitId || "")}&refDate=${encodeURIComponent(item.date || "")}`}
                >
                  レッスンノートへ
                </Link>
                <Link
                  className={t.btnSub}
                  href={`/teacher/homework?lessonUnitId=${encodeURIComponent(item.lessonUnitId || "")}&studentId=${encodeURIComponent(item.studentId || "")}&lessonDate=${encodeURIComponent(item.date || "")}`}
                >
                  宿題
                </Link>
              </div>
            </article>
          ))}
          {rows.length === 0 ? <p className={t.empty}>この日の担当レッスンはありません。</p> : null}
        </div>
      </main>
    </div>
  );
}

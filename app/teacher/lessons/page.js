import Link from "next/link";
import styles from "../../login/login.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listReservationsForAdmin } from "../../../lib/auth/store";
import TeacherTopNav from "../TeacherTopNav";

function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

function statusLabel(status) {
  if (status === "requested") return "予約申請中";
  if (status === "confirmed") return "予約確定";
  if (status === "completed") return "完了";
  if (status === "cancelled") return "キャンセル";
  return status || "-";
}

export default async function TeacherLessonsPage({ searchParams }) {
  const session = await requireRole(["teacher"]);
  const query = await searchParams;
  const date = String(query?.date || todayInJst()).trim();
  const reservationResult = await listReservationsForAdmin({ page: 1, pageSize: 400, fromDate: date, toDate: date });
  const rows = (reservationResult.items || [])
    .filter((item) => item.instructorUserId === session.user.id)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>本日のレッスン</h1>
        <p className={styles.description}>担当レッスンの進行状況と次アクションを確認します。</p>
        <TeacherTopNav currentPath="/teacher/lessons" />
        <form method="GET">
          <label className={styles.label}>
            日付
            <input className={styles.field} type="date" name="date" defaultValue={date} />
          </label>
          <button className={styles.button} type="submit">表示</button>
        </form>
        <div className={styles.links}>
          {rows.map((item) => (
            <article key={item.id} className={styles.reservationCard}>
              <div className={styles.reservationCardHead}>
                <p className={styles.reservationDate}>{item.date}</p>
                <p className={styles.reservationTime}>{item.time}</p>
                <span className={styles.reservationStatusBadge}>{statusLabel(item.status)}</span>
              </div>
              <div className={styles.reservationMeta}>
                <p>学生: {item.studentNameKanji || "-"}</p>
                <p>時間: {item.durationMinutes}分</p>
                <p>授業形式: {item.lessonDeliveryType === "online" ? "オンライン" : "対面"}</p>
              </div>
              <div className={styles.links}>
                <Link className={styles.link} href={`/teacher/lesson-notes?lessonUnitId=${encodeURIComponent(item.lessonUnitId || "")}`}>
                  レッスンノートへ
                </Link>
                <Link className={styles.link} href={`/teacher/homework?lessonUnitId=${encodeURIComponent(item.lessonUnitId || "")}&studentId=${encodeURIComponent(item.studentId || "")}&lessonDate=${encodeURIComponent(item.date || "")}`}>
                  宿題へ
                </Link>
              </div>
            </article>
          ))}
          {rows.length === 0 ? <p>表示できる担当レッスンがありません。</p> : null}
        </div>
      </main>
    </div>
  );
}

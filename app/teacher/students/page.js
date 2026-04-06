import Link from "next/link";
import styles from "../../login/login.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listStudentsForTeacherOverview } from "../../../lib/auth/store";
import TeacherTopNav from "../TeacherTopNav";

export default async function TeacherStudentsPage({ searchParams }) {
  await requireRole(["teacher"]);
  const query = await searchParams;
  const keyword = String(query?.q || "").trim().toLowerCase();
  const students = await listStudentsForTeacherOverview();
  const rows = students.filter((item) => {
    if (!keyword) return true;
    const target = [item.studentNumber, item.nameKanji, item.nameFurigana, item.email]
      .map((v) => String(v || "").toLowerCase())
      .join(" ");
    return target.includes(keyword);
  });

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>生徒メモ・検索</h1>
        <p className={styles.description}>学生を検索し、学習統計・ノート・宿題へすぐ移動できます。</p>
        <TeacherTopNav currentPath="/teacher/students" />
        <form method="GET">
          <label className={styles.label}>
            キーワード
            <input className={styles.field} name="q" defaultValue={keyword} placeholder="名前 / 会員番号 / メール" />
          </label>
          <button className={styles.button} type="submit">検索</button>
        </form>
        <div className={styles.links}>
          {rows.map((student) => (
            <article key={student.id} className={styles.infoCard}>
              <p>{student.studentNumber || "-"} / {student.nameKanji || "-"}</p>
              <p>{student.nameFurigana || "-"}</p>
              <p>{student.email || "-"}</p>
              <div className={styles.links}>
                <Link className={styles.link} href={`/teacher/students/${encodeURIComponent(student.id)}`}>
                  直近サマリー
                </Link>
                <Link className={styles.link} href={`/teacher/progress?studentId=${encodeURIComponent(student.id)}`}>
                  学習統計
                </Link>
                <Link className={styles.link} href={`/teacher/lesson-notes?studentId=${encodeURIComponent(student.id)}`}>
                  レッスンノート
                </Link>
                <Link className={styles.link} href={`/teacher/homework?studentId=${encodeURIComponent(student.id)}`}>
                  宿題
                </Link>
              </div>
            </article>
          ))}
          {rows.length === 0 ? <p>検索結果がありません。</p> : null}
        </div>
      </main>
    </div>
  );
}

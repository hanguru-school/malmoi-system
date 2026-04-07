import Link from "next/link";
import styles from "../../login/login.module.css";
import { requireRole } from "../../../lib/auth/session";
import {
  getStudentLearningStatsForTeacher,
  listStudentsForTeacherOverview,
} from "../../../lib/auth/store";
import TeacherTopNav from "../TeacherTopNav";

function periodLabel(period) {
  if (period === "90") return "直近3ヶ月";
  if (period === "all") return "全期間";
  return "直近1ヶ月";
}

export default async function TeacherProgressPage({ searchParams }) {
  await requireRole(["teacher"]);
  const query = await searchParams;
  const period = String(query?.period || "30").trim();
  const selectedStudentId = String(query?.studentId || "").trim();
  const students = await listStudentsForTeacherOverview();
  const effectiveStudentId = selectedStudentId || students[0]?.id || "";
  const stats = effectiveStudentId
    ? await getStudentLearningStatsForTeacher(effectiveStudentId, { period })
    : null;

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>学習統計 (先生)</h1>
        <p className={styles.description}>担当前の学生状況を短時間で把握するための要約画面です。</p>
        <TeacherTopNav currentPath="/teacher/progress" />

        <form method="GET">
          <label className={styles.label}>
            学生選択
            <select name="studentId" className={styles.field} defaultValue={effectiveStudentId}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentNumber || "-"} / {student.nameKanji || "-"} / {student.nameFurigana || "-"}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            期間
            <select name="period" className={styles.field} defaultValue={period}>
              <option value="30">直近1ヶ月</option>
              <option value="90">直近3ヶ月</option>
              <option value="all">全期間</option>
            </select>
          </label>
          <button className={styles.button} type="submit">表示</button>
        </form>

        {stats ? (
          <>
            <h2 className={styles.sectionTitle}>基本状況 ({periodLabel(period)})</h2>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>総受講回数</p>
                <p className={styles.summaryValue}>{stats.summary?.totalLessonCount ?? 0}回</p>
              </article>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>直近受講回数</p>
                <p className={styles.summaryValue}>{stats.summary?.periodLessonCount ?? 0}回</p>
              </article>
            </div>
            <section className={styles.noticeCard}>
              <h2 className={styles.sectionTitle}>最近テーマ / 復習ポイント</h2>
              <ul className={styles.noticeList}>
                {(stats.recentThemes || []).map((theme) => (
                  <li key={`${theme.label}-${theme.count}`}>{theme.label} ({theme.count})</li>
                ))}
                {(stats.recentThemes || []).length === 0 ? <li>テーマデータがありません。</li> : null}
              </ul>
              <ul className={styles.noticeList}>
                {(stats.reviewPoints || []).map((point, index) => (
                  <li key={`review-${index}`}>{point}</li>
                ))}
                {(stats.reviewPoints || []).length === 0 ? <li>復習ポイントがありません。</li> : null}
              </ul>
              <p className={styles.subtitle}>先生メモ: {stats.motivationMessages?.staff || "-"}</p>
            </section>
          </>
        ) : (
          <p className={styles.description}>学生データがありません。</p>
        )}
        <div className={styles.links}>
          <Link className={styles.link} href="/teacher/students">学生検索へ戻る</Link>
          <Link className={styles.link} href="/teacher">先生ホームへ戻る</Link>
        </div>
      </main>
    </div>
  );
}

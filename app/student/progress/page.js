import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth/session";
import { getStudentLearningStatsForStudent } from "../../../lib/auth/store";
import StudentAreaLayout from "../StudentAreaLayout";
import styles from "../student.module.css";

function periodLabel(period) {
  if (period === "90") return "直近3ヶ月";
  if (period === "all") return "全期間";
  return "直近1ヶ月";
}

export default async function StudentProgressPage({ searchParams }) {
  const session = await requireRole(["student"]);
  if (!session.student) redirect("/student/register/start");
  const query = await searchParams;
  const period = String(query?.period || "30").trim();
  const stats = await getStudentLearningStatsForStudent(session.user.id, { period });

  return (
    <StudentAreaLayout title="学習状況" subtitle="学習の流れと復習ポイントを確認できます。">
      <section className={styles.welcomeCard}>
        <p>{stats?.motivationMessages?.student || "最近の学習データをもとに次の目標を確認しましょう。"}</p>
      </section>

      <div className={styles.statusRow}>
        <Link className={styles.statusBadge} href="/student/progress?period=30">直近1ヶ月</Link>
        <Link className={styles.statusBadge} href="/student/progress?period=90">直近3ヶ月</Link>
        <Link className={styles.statusBadge} href="/student/progress?period=all">全期間</Link>
      </div>

      <h2 className={styles.sectionTitle}>学習の基本状況 ({periodLabel(period)})</h2>
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>これまでのレッスン回数</p>
          <p className={styles.summaryValue}>{stats?.summary?.totalLessonCount ?? 0}回</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>今月の受講回数</p>
          <p className={styles.summaryValue}>{stats?.summary?.monthLessonCount ?? 0}回</p>
        </article>
      </section>
      <section className={styles.nextReservationCard}>
        <p>最新レッスン日: {stats?.summary?.latestLessonDate || "-"}</p>
        <p>最新レッスンノート日: {stats?.summary?.latestLessonNoteDate || "-"}</p>
        <p>現在の学習テーマ: {stats?.summary?.currentLearningTheme || "-"}</p>
        <p>宿題(全体): {stats?.summary?.homeworkTotalCount ?? 0}件</p>
        <p>宿題(完了): {stats?.summary?.homeworkCompletedCount ?? 0}件</p>
      </section>

      <section className={styles.noticeCard}>
        <h2 className={styles.sectionTitle}>最近の学習テーマ</h2>
        <div className={styles.statusRow}>
          {(stats?.recentThemes || []).map((theme) => (
            <span key={`${theme.label}-${theme.count}`} className={styles.statusBadge}>
              {theme.label} ({theme.count})
            </span>
          ))}
          {(stats?.recentThemes || []).length === 0 ? <span className={styles.subtitle}>データ準備中</span> : null}
        </div>
      </section>

      <section className={styles.noticeCard}>
        <h2 className={styles.sectionTitle}>復習ポイント</h2>
        <ul className={styles.noticeList}>
          {(stats?.reviewPoints || []).map((point, index) => (
            <li key={`review-${index}`}>{point}</li>
          ))}
          {(stats?.reviewPoints || []).length === 0 ? <li>次回ノート公開後に表示されます。</li> : null}
        </ul>
      </section>

      <section className={styles.noticeCard}>
        <h2 className={styles.sectionTitle}>今回の宿題 / 次回ポイント</h2>
        <ul className={styles.noticeList}>
          {(stats?.homeworkFlow || []).map((item, index) => (
            <li key={`homework-${index}`}>{item}</li>
          ))}
          {(stats?.homeworkFlow || []).length === 0 ? <li>現在表示できる宿題はありません。</li> : null}
        </ul>
        <p className={styles.subtitle}>{stats?.continuityLabel || "-"}</p>
      </section>
    </StudentAreaLayout>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../../login/login.module.css";
import { requireRole } from "../../../../../lib/auth/session";
import { getStudentLearningStatsForParentChild } from "../../../../../lib/auth/store";
import ParentTopNav from "../../../ParentTopNav";

function periodLabel(period) {
  if (period === "90") return "直近3ヶ月";
  if (period === "all") return "全期間";
  return "直近1ヶ月";
}

export default async function ParentChildProgressPage({ params, searchParams }) {
  const session = await requireRole(["parent"]);
  const { studentId } = await params;
  const query = await searchParams;
  const period = String(query?.period || "30").trim();
  const stats = await getStudentLearningStatsForParentChild(session.user.id, studentId, { period });
  if (!stats) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>学習状況 (保護者)</h1>
        <p className={styles.description}>
          {stats.student?.nameKanji || "-"} ({stats.student?.studentNumber || "-"}) / {periodLabel(period)}
        </p>
        <ParentTopNav
          currentPath={`/parent/children/${studentId}/progress`}
          studentId={studentId}
          permissions={stats.permissions}
        />
        <p className={styles.description}>
          {stats.motivationMessages?.parent || "最近の学習内容と宿題状況を確認できます。"}
        </p>

        <div className={styles.statusRow}>
          <Link className={styles.statusBadge} href={`/parent/children/${studentId}/progress?period=30`}>直近1ヶ月</Link>
          <Link className={styles.statusBadge} href={`/parent/children/${studentId}/progress?period=90`}>直近3ヶ月</Link>
          <Link className={styles.statusBadge} href={`/parent/children/${studentId}/progress?period=all`}>全期間</Link>
        </div>

        {!stats.canView ? (
          <p className={styles.message}>学習統計を閲覧する権限がありません。</p>
        ) : (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>今月の受講回数</p>
                <p className={styles.summaryValue}>{stats.summary?.monthLessonCount ?? 0}回</p>
              </article>
              <article className={styles.summaryCard}>
                <p className={styles.summaryLabel}>直近期間の受講回数</p>
                <p className={styles.summaryValue}>{stats.summary?.periodLessonCount ?? 0}回</p>
              </article>
            </div>

            <section className={styles.noticeCard}>
              <h2 className={styles.sectionTitle}>最近の学習内容</h2>
              <p>現在テーマ: {stats.summary?.currentLearningTheme || "-"}</p>
              <ul className={styles.noticeList}>
                {(stats.recentThemes || []).map((theme) => (
                  <li key={`${theme.label}-${theme.count}`}>{theme.label} ({theme.count})</li>
                ))}
                {(stats.recentThemes || []).length === 0 ? <li>テーマ情報は準備中です。</li> : null}
              </ul>
            </section>

            <section className={styles.noticeCard}>
              <h2 className={styles.sectionTitle}>宿題 / 先生コメント</h2>
              <p>宿題有無: {stats.summary?.recentHomeworkExists ? "あり" : "なし"}</p>
              <p>宿題(全体): {stats.summary?.homeworkTotalCount ?? 0}件</p>
              <p>宿題(完了): {stats.summary?.homeworkCompletedCount ?? 0}件</p>
              <ul className={styles.noticeList}>
                {(stats.homeworkFlow || []).map((item, index) => (
                  <li key={`hw-${index}`}>{item}</li>
                ))}
                {(stats.homeworkFlow || []).length === 0 ? <li>現在表示できる宿題はありません。</li> : null}
              </ul>
              <p className={styles.subtitle}>{stats.motivationMessages?.parent || "-"}</p>
            </section>
          </>
        )}

        <div className={styles.links}>
          <Link className={styles.link} href={`/parent/children/${studentId}`}>
            子ども詳細へ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

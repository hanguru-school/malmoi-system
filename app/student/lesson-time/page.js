import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth/session";
import { getStudentLessonMinutesUsageForPortal } from "../../../lib/auth/store";
import StudentAreaLayout from "../StudentAreaLayout";
import styles from "./lesson-time.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function attentionMessage(key) {
  if (key === "exhausted") {
    return {
      tone: "danger",
      text: "レッスン時間の残りがなくなっています。継続して受講される前に、教室へお問い合わせください。",
    };
  }
  if (key === "low") {
    return {
      tone: "warn",
      text: "残り時間が180分以下です。そろそろ追加やプランのご相談が必要かもしれません。",
    };
  }
  if (key === "next_short") {
    return {
      tone: "warn",
      text: "次のレッスンを終えたあと、時間が不足する見込みです。早めに教室へご相談ください。",
    };
  }
  return null;
}

export default async function StudentLessonTimePage() {
  const session = await requireRole(["student"]);
  if (!session.student) redirect("/student/register/start");
  if (session.student.registrationStatus !== "completed") {
    if (session.student.registrationStatus === "start_pending_profile") redirect("/student/register/profile");
    redirect("/student/register/consent");
  }

  const usage = await getStudentLessonMinutesUsageForPortal(session.user.id);
  if (!usage) redirect("/student");

  const rem = usage.lessonMinutes.remainingMinutes;
  const prev = usage.completionPreview;
  const alert = attentionMessage(usage.minutesAttention);

  return (
    <StudentAreaLayout title="レッスン時間" subtitle="受講に使った時間の目安です（会計書類ではありません）">
      <div className={styles.root}>
        <section className={styles.heroCard}>
          <p className={styles.heroTitle}>いま残っているレッスン時間</p>
          <p className={styles.heroRemain}>
            {rem}
            <span className={styles.heroUnit}>分</span>
          </p>
          {prev?.projectedRemainingHintJa ? <p className={styles.subLine}>{prev.projectedRemainingHintJa}</p> : null}
          {prev?.completionHintJa && usage.minutesAttention !== "exhausted" ? (
            <p className={styles.subLine}>{prev.completionHintJa}</p>
          ) : null}
        </section>

        {alert ? (
          <p className={styles.alert} data-tone={alert.tone} role="status">
            {alert.text}
          </p>
        ) : null}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>最近ついた時間</h2>
          <p className={styles.sectionLead}>購入・付与などで増えた記録です。</p>
          {usage.recentCharges.length === 0 ? (
            <p className={styles.empty}>まだ表示できる記録がありません。</p>
          ) : (
            <ul className={styles.timeline}>
              {usage.recentCharges.map((row) => (
                <li key={row.id}>
                  <p className={styles.lineMain}>{row.lineJa}</p>
                  <p className={styles.lineSub}>{row.subJa}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>最近使った時間</h2>
          <p className={styles.sectionLead}>レッスンを終えたあとに記録された分です。</p>
          {usage.recentUsage.length === 0 ? (
            <p className={styles.empty}>まだ表示できる記録がありません。</p>
          ) : (
            <ul className={styles.timeline}>
              {usage.recentUsage.map((row) => (
                <li key={row.id}>
                  <p className={styles.lineMain}>{row.lineJa}</p>
                  <p className={styles.lineSub}>{row.subJa}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className={styles.empty}>
          ※ 表示は教室の記録に基づく目安です。最終的な残時間は教室の案内を優先してください。
        </p>
        <Link className={styles.footerLink} href="/student">
          ホームに戻る
        </Link>
      </div>
    </StudentAreaLayout>
  );
}

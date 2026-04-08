import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth/session";
import { getStudentLessonMinutesUsageForPortal } from "../../../lib/auth/store";
import { POINTS_POLICY_SUMMARY_JA } from "../../../lib/operational/pointsPolicy.js";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentLessonTimeFlow from "../StudentLessonTimeFlow";
import styles from "./lesson-time.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function attentionMessage(key) {
  if (key === "exhausted") {
    return {
      tone: "danger",
      text: "いまレッスン時間の残りがありません。次のレッスンを受ける前に、教室へ一声おかけください。",
    };
  }
  if (key === "low") {
    return {
      tone: "warn",
      text: "残りが180分以下です。無理のないペースで、追加やプランについて相談してみてください。",
    };
  }
  if (key === "next_short") {
    return {
      tone: "warn",
      text: "次のレッスンを終えると、時間が足りなくなる見込みです。早めに教室へご相談ください。",
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

  const prev = usage.completionPreview;
  const alert = attentionMessage(usage.minutesAttention);
  const stu = session.student || {};
  const ptsBal = usage.points?.balance ?? stu.points?.balance ?? 0;
  const purchasedPts = usage.points?.totalFromCompletedPayments ?? null;

  return (
    <StudentAreaLayout title="レッスン時間・利用状況" subtitle="時間とポイントの内訳">
      <div className={styles.root}>
        <p className={styles.intro}>
          レッスンで使った時間・付与された時間・ポイントの<strong>記録の見える化</strong>です。領収書や請求書ではありません。
          {POINTS_POLICY_SUMMARY_JA}
        </p>

        <section className={styles.flowShell} aria-label="時間とポイントの概要">
          <StudentLessonTimeFlow
            variant="profile"
            totalMinutes={usage.lessonMinutes.totalMinutes ?? 0}
            usedMinutes={usage.lessonMinutes.usedMinutes ?? 0}
            remainingMinutes={usage.lessonMinutes.remainingMinutes ?? 0}
            pointsBalance={ptsBal}
            pointConvertedMinutes={stu.pointConvertedMinutes ?? 0}
            reservedMinutesOverride={usage.reservedMinutesSum}
            purchasedPointsTotal={purchasedPts}
          />
          {prev?.completionHintJa && usage.minutesAttention !== "exhausted" ? (
            <p className={styles.previewHint} data-tone="info">
              {prev.completionHintJa}
            </p>
          ) : null}
          {prev?.projectedRemainingHintJa ? (
            <p className={styles.previewHint} data-tone="info">
              {prev.projectedRemainingHintJa}
            </p>
          ) : null}
        </section>

        {alert ? (
          <p className={styles.alert} data-tone={alert.tone} role="status">
            {alert.text}
          </p>
        ) : null}
        {alert ? (
          <p className={styles.alertGuide} data-tone={alert.tone}>
            追加の手続きやご不明点は教室へお問い合わせください。このページでは記録の確認が中心です。
          </p>
        ) : null}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>最近、レッスンで使った時間</h2>
          <p className={styles.sectionLead}>受講が完了して記録された分です。</p>
          {usage.recentUsage.length === 0 ? (
            <p className={styles.empty}>まだここに表示できる記録はありません。</p>
          ) : (
            <ul className={styles.timeline}>
              {usage.recentUsage.map((row) => (
                <li key={row.id} data-kind="usage">
                  <p className={styles.lineMain}>{row.lineJa}</p>
                  <p className={styles.lineSub}>{row.subJa}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>最近、増えた時間</h2>
          <p className={styles.sectionLead}>購入や付与などでレッスン時間が増えたときの記録です。</p>
          {usage.recentCharges.length === 0 ? (
            <p className={styles.empty}>まだここに表示できる記録はありません。</p>
          ) : (
            <ul className={styles.timeline}>
              {usage.recentCharges.map((row) => (
                <li key={row.id} data-kind="charge">
                  <p className={styles.lineMain}>{row.lineJa}</p>
                  <p className={styles.lineSub}>{row.subJa}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className={styles.footnote}>
          ※ 表示は教室の記録に基づく目安です。予約やキャンセルのタイミングで変わることがあります。
        </p>
        <Link className={styles.footerLink} href="/student">
          ホームに戻る
        </Link>
      </div>
    </StudentAreaLayout>
  );
}

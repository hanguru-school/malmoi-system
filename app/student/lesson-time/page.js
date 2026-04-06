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

  const rem = usage.lessonMinutes.remainingMinutes;
  const prev = usage.completionPreview;
  const alert = attentionMessage(usage.minutesAttention);
  const projected = prev?.projectedRemainingAfterNext;

  return (
    <StudentAreaLayout title="レッスン時間" subtitle="受講の記録を、やさしい一覧で">
      <div className={styles.root}>
        <p className={styles.intro}>
          ここでは、レッスンで使った時間や追加された時間の<strong>あとがき</strong>のような一覧です。領収書や請求書ではありません。数字で不安になったら、いつでも教室にご相談ください。
        </p>

        <section className={styles.heroCard}>
          <p className={styles.heroTitle}>いま使える時間</p>
          <p className={styles.heroRemain}>
            {rem}
            <span className={styles.heroUnit}>分</span>
          </p>
          {typeof projected === "number" && prev?.nextReservationDeductMinutes ? (
            <div className={styles.projectedBox}>
              <p className={styles.projectedLabel}>次のレッスン後の目安</p>
              <p className={styles.subLine}>
                次の予約（約{prev.nextReservationDeductMinutes}分）が終わったあと、だいたい
                <strong> {projected}分</strong> 残る見込みです（参考値）。
              </p>
            </div>
          ) : (
            <p className={styles.subLine} style={{ marginTop: "0.5rem" }}>
              次の予約がまだない、または確定前のため、完了後の目安は表示していません。
            </p>
          )}
          {prev?.completionHintJa && usage.minutesAttention !== "exhausted" ? (
            <p className={styles.subLine} style={{ marginTop: "0.45rem" }}>
              {prev.completionHintJa}
            </p>
          ) : null}
        </section>

        {alert ? (
          <p className={styles.alert} data-tone={alert.tone} role="status">
            {alert.text}
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

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth/session";
import StudentAreaLayout from "../StudentAreaLayout";
import styles from "./learning.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const CARDS = [
  {
    href: "/student/lesson-notes",
    eyebrow: "履歴",
    title: "レッスンノート",
    body: "直近の授業内容・講師メモを振り返れます。",
  },
  {
    href: "/student/homework",
    eyebrow: "宿題",
    title: "宿題・課題",
    body: "提出状況と期限をまとめて確認できます。",
  },
  {
    href: "/student/progress",
    eyebrow: "進捗",
    title: "学習状況・復習",
    body: "目標や復習ポイントの確認に使います。",
  },
  {
    href: "/student/homework",
    eyebrow: "単語",
    title: "単語・語彙の復習",
    body: "宿題タイプに「単語」がある場合はここから一覧へ進めます。",
  },
];

export default async function StudentLearningHubPage() {
  const session = await requireRole(["student"]);
  if (!session.student) redirect("/student/register/start");
  if (session.student.registrationStatus !== "completed") {
    if (session.student.registrationStatus === "start_pending_profile") redirect("/student/register/profile");
    redirect("/student/register/consent");
  }

  return (
    <StudentAreaLayout title="学習ハブ" subtitle="レッスン後の流れをここから">
      <div className={styles.root}>
        <p className={styles.lead}>
          ノート・宿題・進捗を<strong>一か所から</strong>開けます。予約や時間の確認は
          <Link href="/student">ホーム</Link>や<Link href="/student/lesson-time">レッスン時間</Link>へ。
        </p>
        <ul className={styles.grid}>
          {CARDS.map((c) => (
            <li key={c.title}>
              <Link className={styles.card} href={c.href}>
                <span className={styles.eyebrow}>{c.eyebrow}</span>
                <span className={styles.cardTitle}>{c.title}</span>
                <span className={styles.body}>{c.body}</span>
                <span className={styles.chev} aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </StudentAreaLayout>
  );
}

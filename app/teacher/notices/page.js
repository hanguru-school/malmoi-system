import Link from "next/link";
import { requireRole } from "../../../lib/auth/session";
import { listNoticesForStudent } from "../../../lib/auth/store";
import TeacherTopNav from "../TeacherTopNav";
import t from "../teacher.module.css";

export default async function TeacherNoticesPage() {
  await requireRole(["teacher"]);
  const notices = await listNoticesForStudent({ limit: 40 });

  return (
    <div className={t.shell}>
      <main className={t.main}>
        <h1 className={t.title}>お知らせ</h1>
        <p className={t.subtitle}>公開中のお知らせを確認します（教室からの共有）。</p>
        <TeacherTopNav currentPath="/teacher/notices" />
        <div className={t.noticeList}>
          {notices.map((n) => (
            <article key={n.id} className={t.noticeCard}>
              <Link href={`/teacher/notices/${encodeURIComponent(n.id)}`}>{n.title}</Link>
              {n.isImportant ? <span style={{ fontSize: "0.75rem", color: "#b45309" }}> ・重要</span> : null}
              <p className={t.noticeDate}>{String(n.publishedAt || n.updatedAt || "").slice(0, 10) || "—"}</p>
            </article>
          ))}
          {notices.length === 0 ? <p className={t.empty}>表示できるお知らせはありません。</p> : null}
        </div>
      </main>
    </div>
  );
}

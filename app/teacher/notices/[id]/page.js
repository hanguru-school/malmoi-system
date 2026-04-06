import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "../../../../lib/auth/session";
import { getNoticeByIdForStudent } from "../../../../lib/auth/store";
import TeacherTopNav from "../../TeacherTopNav";
import t from "../../teacher.module.css";

export default async function TeacherNoticeDetailPage({ params }) {
  await requireRole(["teacher"]);
  const { id } = await params;
  const notice = await getNoticeByIdForStudent(id);
  if (!notice) notFound();

  return (
    <div className={t.shell}>
      <main className={t.main}>
        <h1 className={t.title}>{notice.title}</h1>
        <p className={t.subtitle}>{String(notice.publishedAt || notice.updatedAt || "").slice(0, 10) || "—"}</p>
        <TeacherTopNav currentPath="/teacher/notices" />
        <div style={{ marginTop: "1rem", lineHeight: 1.65, color: "#334155" }}>
          {notice.summary ? (
            <p style={{ marginBottom: "0.75rem" }}>
              <strong>概要</strong> {notice.summary}
            </p>
          ) : null}
          <div style={{ whiteSpace: "pre-wrap" }}>{notice.content || "—"}</div>
        </div>
        <p style={{ marginTop: "1.25rem" }}>
          <Link href="/teacher/notices">お知らせ一覧へ戻る</Link>
        </p>
      </main>
    </div>
  );
}

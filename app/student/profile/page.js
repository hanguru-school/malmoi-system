import { requireRole } from "../../../lib/auth/session";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentProfilePanel from "./StudentProfilePanel";

/** 常にサーバーで描画し、CDN/ブラウザの古いHTMLキャッシュを避ける */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function StudentProfilePage() {
  const session = await requireRole(["student"]);
  const student = session.student || {};

  return (
    <StudentAreaLayout title="個人情報">
      <StudentProfilePanel session={session} student={student} />
    </StudentAreaLayout>
  );
}

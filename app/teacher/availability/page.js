import styles from "../../login/login.module.css";
import adminStyles from "../../admin/admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { getTeacherAvailabilityForSelf } from "../../../lib/auth/store";
import TeacherTopNav from "../TeacherTopNav";
import TeacherAvailabilityClient from "./TeacherAvailabilityClient";

export default async function TeacherAvailabilityPage() {
  const session = await requireRole(["teacher"]);
  const initial = await getTeacherAvailabilityForSelf(session.user.id);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <TeacherTopNav currentPath="/teacher/availability" />
        <h1 className={styles.sectionTitle}>担当可能時間</h1>
        <p className={styles.description}>
          週次テンプレートと日付例外を編集します。管理者が「管理者のみ変更」の場合は保存できません。
        </p>
        <TeacherAvailabilityClient initial={initial} />
      </main>
    </div>
  );
}

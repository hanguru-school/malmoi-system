import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import { requireRole } from "../../../lib/auth/session";
import { listStudentsForAdmin } from "../../../lib/auth/store";
import AdminTopNav from "../AdminTopNav";

export default async function AdminParentsPage() {
  await requireRole(["admin"]);
  const result = await listStudentsForAdmin({}, { page: 1, pageSize: 50 });
  const students = result.items || [];
  const minorStudents = students.filter((student) => student.isMinor);
  const guardianRequired = students.filter((student) => student.guardianRequired);

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>保護者管理</h1>
        <p className={styles.description}>
          保護者連携は学生詳細画面で管理します。未連携の未成年学生を優先して確認してください。
        </p>
        <AdminTopNav currentPath="/admin/parents" />
        <div className={styles.infoCard}>
          <p>未成年学生: {minorStudents.length} 名</p>
          <p>保護者必須設定: {guardianRequired.length} 名</p>
          <p>操作: 学生詳細 → 保護者連携セクション</p>
        </div>
        <div className={styles.links}>
          <a className={styles.link} href="/admin/students">
            学生管理へ
          </a>
        </div>
      </main>
    </div>
  );
}


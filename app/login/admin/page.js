import StudentPasswordLoginForm from "../StudentPasswordLoginForm";
import styles from "../login.module.css";
import { getSystemUrls } from "../../../lib/systemUrls";

export default async function AdminLoginPage() {
  const { introUrl } = getSystemUrls();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>MalMoi Portal</h1>
        <p className={styles.brandSub}>MalMoi 韓国語教室</p>
        <p className={styles.brandSub}>管理者ログイン</p>

        <StudentPasswordLoginForm
          introUrl={introUrl}
          title="管理者ログイン"
          role="admin"
          loginIdPlaceholder="メールアドレス / 電話番号"
          showStudentUtilityLinks={false}
          showStaffLinks
          fallbackNextPath="/admin"
          roleLinks={[
            { href: "/login", label: "学生ログイン" },
            { href: "/login/parent", label: "保護者ログイン" },
            { href: "/login/teacher", label: "先生ログイン" },
          ]}
          extraLinks={[
            { href: "/login/admin/password-reset", label: "パスワードをお忘れですか？" },
          ]}
        />
      </main>
    </div>
  );
}

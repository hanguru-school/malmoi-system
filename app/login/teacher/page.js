import StudentPasswordLoginForm from "../StudentPasswordLoginForm";
import styles from "../login.module.css";
import { getSystemUrls } from "../../../lib/systemUrls";

export default async function TeacherLoginPage() {
  const { introUrl } = getSystemUrls();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>MalMoi Portal</h1>
        <p className={styles.brandSub}>MalMoi 韓国語教室</p>
        <p className={styles.brandSub}>予約・学習管理システム</p>

        <h2 className={styles.sectionTitle}>先生ログイン</h2>
        <p className={styles.description}>
          先生向けログイン画面です。
          <br />
          ログインID(メール/電話番号)とパスワードでログインしてください。
        </p>

        <StudentPasswordLoginForm
          introUrl={introUrl}
          title="先生ログイン"
          role="teacher"
          loginIdPlaceholder="メールアドレス / 電話番号"
          showStudentUtilityLinks={false}
          showStaffLinks
          fallbackNextPath="/teacher"
          roleLinks={[
            { href: "/login", label: "学生ログイン" },
            { href: "/login/parent", label: "保護者ログイン" },
            { href: "/login/admin", label: "管理者ログイン" },
          ]}
          extraLinks={[{ href: "/password-reset/request", label: "パスワードをお忘れの方" }]}
        />
      </main>
    </div>
  );
}

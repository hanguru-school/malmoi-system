import { redirect } from "next/navigation";
import styles from "../../../login/login.module.css";
import { requireStudentRegistrationSession } from "../../../../lib/auth/session";
import ConsentForm from "./ConsentForm";

export default async function StudentRegisterConsentPage() {
  const session = await requireStudentRegistrationSession();
  if (session.student.consentStatus === "agreed") redirect("/student/register/profile");

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>教室規定・入会同意</h1>
        <p className={styles.description}>ステップ 2 / 3</p>
        <p className={styles.description}>
          登録を進める前に、教室規定と入会内容をご確認ください。
        </p>
        <div className={styles.message}>
          <p>1) 授業および予約関連規定を遵守します。</p>
          <p>2) 入力した個人情報を正確に維持します。</p>
          <p>3) システム運営目的の基本情報処理に同意します。</p>
        </div>
        <ConsentForm />
      </main>
    </div>
  );
}

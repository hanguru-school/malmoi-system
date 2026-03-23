import { redirect } from "next/navigation";
import styles from "../../../login/login.module.css";
import { requireStudentRegistrationSession } from "../../../../lib/auth/session";
import ProfileForm from "./ProfileForm";

export default async function StudentRegisterProfilePage() {
  const session = await requireStudentRegistrationSession();
  if (session.student.consentStatus !== "agreed") redirect("/student/register/consent");

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>個人情報入力</h1>
        <p className={styles.description}>ステップ 3 / 3</p>
        <p className={styles.description}>必要な情報を入力してください。</p>
        <ProfileForm student={session.student} />
      </main>
    </div>
  );
}

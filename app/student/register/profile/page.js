import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "../../../login/login.module.css";
import { requireStudentRegistrationSession } from "../../../../lib/auth/session";
import { registrationConsentPathPreservingUi } from "../../../../lib/student/registrationNavPaths";
import { useStudentRegistrationUiV2 } from "../../../../lib/ui/featureFlags";
import StudentRegisterChromeV2 from "../StudentRegisterChromeV2";
import rv2 from "../register-v2.module.css";
import ProfileForm from "./ProfileForm";

export default async function StudentRegisterProfilePage({ searchParams }) {
  const session = await requireStudentRegistrationSession();
  const params = await searchParams;
  if (session.student.consentStatus !== "agreed") {
    redirect(registrationConsentPathPreservingUi(params?.ui));
  }

  const useV2 = useStudentRegistrationUiV2(params?.ui);

  if (useV2) {
    return (
      <StudentRegisterChromeV2
        step={3}
        title="プロフィールを入力"
        subtitle="連絡先・緊急連絡先など、教室運営に必要な情報を入力してください。"
      >
        <ProfileForm student={session.student} registrationUi={params?.ui} />
        <div className={rv2.footerLinks}>
          <Link href="/student/register/profile?ui=v1">以前の画面</Link>
        </div>
      </StudentRegisterChromeV2>
    );
  }

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>個人情報入力</h1>
        <p className={styles.description}>ステップ 3 / 3</p>
        <p className={styles.description}>必要な情報を入力してください。</p>
        <ProfileForm student={session.student} registrationUi={params?.ui} />
        <p className={styles.stepNote} style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href="/student/register/profile?ui=v2">新しい登録画面を試す</a>
        </p>
      </main>
    </div>
  );
}

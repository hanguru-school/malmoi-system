import { redirect } from "next/navigation";
import styles from "../../../login/login.module.css";
import { requireStudentRegistrationSession } from "../../../../lib/auth/session";
import { registrationProfilePath } from "../../../../lib/student/registrationNavPaths";
import { useStudentRegistrationUiV2 } from "../../../../lib/ui/featureFlags";
import StudentRegisterChromeV2 from "../StudentRegisterChromeV2";
import ConsentForm from "./ConsentForm";
import ConsentFormV2 from "./ConsentFormV2";

export default async function StudentRegisterConsentPage({ searchParams }) {
  const session = await requireStudentRegistrationSession();
  const params = await searchParams;
  if (session.student.consentStatus === "agreed") {
    redirect(registrationProfilePath(params?.ui));
  }

  const useV2 = useStudentRegistrationUiV2(params?.ui);

  if (useV2) {
    return (
      <StudentRegisterChromeV2
        step={2}
        title="教室規定・入会に同意"
        subtitle="規定を確認のうえ、チェックを入れて次へ進んでください。"
      >
        <div className={styles.message} style={{ marginBottom: "1rem" }}>
          <p>1) 授業および予約関連規定を遵守します。</p>
          <p>2) 入力した個人情報を正確に維持します。</p>
          <p>3) システム運営目的の基本情報処理に同意します。</p>
        </div>
        <ConsentFormV2 registrationUi={params?.ui} />
      </StudentRegisterChromeV2>
    );
  }

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
        <ConsentForm registrationUi={params?.ui} />
        <p className={styles.stepNote} style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href="/student/register/consent?ui=v2">新しい登録画面を試す</a>
        </p>
      </main>
    </div>
  );
}

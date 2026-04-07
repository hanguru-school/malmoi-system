import styles from "../../../login/login.module.css";
import { registrationStartUrlErrorMessage } from "../../../../lib/adapters/studentRegistration";
import { useStudentRegistrationUiV2 } from "../../../../lib/ui/featureFlags";
import StudentRegisterChromeV2 from "../StudentRegisterChromeV2";
import StartRegistrationForm from "./StartRegistrationForm";
import StartRegistrationFormV2 from "./StartRegistrationFormV2";

export default async function StudentRegisterStartPage({ searchParams }) {
  const params = await searchParams;
  const initialErrorText = registrationStartUrlErrorMessage(params?.error);
  const useV2 = useStudentRegistrationUiV2(params?.ui);

  if (useV2) {
    return (
      <StudentRegisterChromeV2
        step={1}
        title="メールで登録を開始"
        subtitle="お名前とメールを入力すると確認メールが届きます。届いたリンクから同意とプロフィール入力へ進みます。"
        metaExtra="所要 約1分"
      >
        <StartRegistrationFormV2 initialErrorText={initialErrorText} />
      </StudentRegisterChromeV2>
    );
  }

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.sectionTitle}>学生初回登録</h1>
        <p className={styles.description}>ステップ 1 / 3</p>
        <p className={styles.stepNote}>所要時間: 約1分</p>
        <p className={styles.description}>
          お名前とメールアドレスを入力すると、
          <br />
          確認メールをお送りします。
        </p>
        <StartRegistrationForm initialErrorText={initialErrorText} />
        <p className={styles.stepNote} style={{ marginTop: "1rem", textAlign: "center" }}>
          <a href="/student/register/start?ui=v2">新しい登録画面を試す</a>
        </p>
      </main>
    </div>
  );
}

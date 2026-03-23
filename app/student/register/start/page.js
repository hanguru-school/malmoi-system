import styles from "../../../login/login.module.css";
import StartRegistrationForm from "./StartRegistrationForm";

function errorMessage(errorCode) {
  const code = String(errorCode || "").trim();
  if (code === "token_missing") return "認証リンクにトークン情報がありません。もう一度登録を開始してください。";
  if (code === "token_not_found") return "認証リンクが無効です。もう一度登録を開始してください。";
  if (code === "token_used") return "この認証リンクはすでに使用されています。もう一度登録を開始してください。";
  if (code === "token_expired") return "認証リンクの有効期限が切れました。もう一度登録を開始してください。";
  if (code) return "認証リンクを確認できませんでした。もう一度登録を開始してください。";
  return "";
}

export default async function StudentRegisterStartPage({ searchParams }) {
  const params = await searchParams;
  const initialErrorText = errorMessage(params?.error);
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
      </main>
    </div>
  );
}

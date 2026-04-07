import StudentPasswordLoginForm from "./StudentPasswordLoginForm";
import styles from "./login.module.css";
import { getSystemUrls } from "../../lib/systemUrls";

export default async function LoginPage() {
  const { introUrl } = getSystemUrls();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <h1 className={styles.brandTitle}>MalMoi Portal</h1>
        <p className={styles.brandSub}>MalMoi 韓国語教室</p>
        <p className={styles.brandSub}>韓国語レッスン ポータル</p>
        <p className={styles.brandMood}>今日も一歩、韓国語に近づきます。</p>

        <StudentPasswordLoginForm introUrl={introUrl} showStaffLinks />
      </main>
    </div>
  );
}

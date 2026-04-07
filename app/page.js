import styles from "./page.module.css";
import { getSystemUrls } from "../lib/systemUrls";

export default function Home() {
  const { loginUrl } = getSystemUrls();

  return (
    <div className={styles.shell}>
      <main className={styles.card}>
        <p className={styles.brand}>韓国語教室</p>
        <h1 className={styles.title}>
          <span className={styles.titleMain}>MalMoi</span>
          <span className={styles.titleSub}>Student Portal</span>
        </h1>
        <p className={styles.subtitle}>
          今日も一歩、韓国語に近づこう。
        </p>

        <p className={styles.lead}>
          あなたの韓国語学習を
          <br />
          MalMoiがサポートします。
        </p>

        <a className={styles.startButton} href={loginUrl}>
          ポータルへ進む
        </a>
      </main>
    </div>
  );
}

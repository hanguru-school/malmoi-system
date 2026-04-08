import styles from "../../../login/login.module.css";
import AdminPointsTimeSettingsClient from "./AdminPointsTimeSettingsClient";

export default async function PointsTimeSettingsPage() {
  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        時間・ポイント設定
      </h2>
      <p className={styles.description}>
        教室全体の換算ルールと、決済・レッスン設定への導線をまとめたハブです。数値の唯一のソースはコード上のポリシーモジュールと、実データ（決済・原簿）です。
      </p>
      <AdminPointsTimeSettingsClient />
    </>
  );
}

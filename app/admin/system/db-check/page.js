import Link from "next/link";
import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import { requireRole } from "../../../../lib/auth/session";
import { buildStorageHealthReport } from "../../../../lib/admin/storage-health";
import AdminTopNav from "../../AdminTopNav";

export default async function AdminStorageCheckPage() {
  await requireRole(["admin"]);
  const report = await buildStorageHealthReport();

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>データ保存状態（診断）</h1>
        <p className={styles.description}>
          本システムは <strong>PostgreSQL / Prisma ではなく</strong>、JSON ファイル（auth-store）にユーザ・予約・監査ログ等を保存します。
          <code style={{ marginLeft: 6 }}>DATABASE_URL</code> は未使用です。
        </p>
        <p className={adminStyles.metaText}>
          JSON API: <Link href="/api/admin/debug/db-check">/api/admin/debug/db-check</Link>（要管理者ログイン）
        </p>
        <AdminTopNav currentPath="/admin/system/db-check" />
        <pre
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 12,
            fontSize: 12,
            overflow: "auto",
            maxHeight: "70vh",
          }}
        >
          {JSON.stringify(report, null, 2)}
        </pre>
      </main>
    </div>
  );
}

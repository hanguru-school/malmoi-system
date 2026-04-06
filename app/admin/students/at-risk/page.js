import Link from "next/link";
import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import { requireRole } from "../../../../lib/auth/session";
import { listAtRiskStudentsForAdmin } from "../../../../lib/auth/store";
import AdminTopNav from "../../AdminTopNav";

function badgeToneClass(tone) {
  if (tone === "danger") return adminStyles.statusBad;
  if (tone === "warn") return adminStyles.statusWarn;
  return "";
}

export default async function AdminStudentsAtRiskPage() {
  await requireRole(["admin"]);
  const { items, total, truncated } = await listAtRiskStudentsForAdmin({ limit: 300 });

  return (
    <div className={adminStyles.adminShell}>
      <main className={adminStyles.adminCard}>
        <h1 className={styles.sectionTitle}>要フォロー学生（読み取り専用）</h1>
        <p className={styles.description}>
          既存の学習シグナル（予約・宿題・ノート・登録後の動きなど）に該当する学生をまとめて表示します。編集は学生詳細から行ってください。
        </p>
        <AdminTopNav currentPath="/admin/students/at-risk" />
        <p className={styles.description}>
          該当 {total} 名
          {truncated ? "（表示上限により一部のみ）" : ""} —{" "}
          <Link className={adminStyles.inlineLink} href="/admin/students">
            学生一覧へ
          </Link>
        </p>

        {items.length === 0 ? (
          <p className={styles.description}>現在、シグナル付きの学生はいません。</p>
        ) : (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>会員番号</th>
                  <th>氏名</th>
                  <th>シグナル</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.studentNumber || "—"}</td>
                    <td>{row.nameKanji || "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {(row.riskBadges || []).map((b) => (
                          <span
                            key={b.id}
                            className={[adminStyles.statusPill, badgeToneClass(b.tone)].filter(Boolean).join(" ")}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Link className={adminStyles.inlineLink} href={`/admin/students/${row.id}`}>
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

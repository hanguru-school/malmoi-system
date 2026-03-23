import Link from "next/link";
import spStyles from "./student-payments.module.css";
import { requireRole } from "../../../lib/auth/session";
import { getStudentPaymentPortalSummary, listPaymentTransactionsForStudent } from "../../../lib/auth/store";
import { jpStudentPaymentCategory } from "../../../lib/payments/receipt-labels";
import StudentAreaLayout from "../StudentAreaLayout";
import StudentPaymentsFilterBar from "./StudentPaymentsFilterBar";

function formatShort(iso) {
  if (!iso) return "—";
  return String(iso).replace("T", " ").slice(0, 16);
}

export default async function StudentPaymentsPage({ searchParams }) {
  const session = await requireRole(["student"]);
  const sp = await searchParams;
  const filterRaw = String(sp?.filter || "all").trim();
  const filter = ["payment", "grant", "all"].includes(filterRaw) ? filterRaw : "all";

  const [items, summary] = await Promise.all([
    listPaymentTransactionsForStudent(session.user.id),
    getStudentPaymentPortalSummary(session.user.id),
  ]);

  let filtered = items;
  if (filter === "payment") {
    filtered = items.filter((t) => String(t.transactionKind) === "payment");
  } else if (filter === "grant") {
    filtered = items.filter((t) => String(t.transactionKind) === "point_grant");
  }

  const activeFilter = filter;

  return (
    <StudentAreaLayout title="決済履歴" subtitle="お支払いとポイント反映の記録です。">
      {summary ? (
        <div className={spStyles.summaryGrid}>
          <div className={spStyles.summaryCell}>
            <p className={spStyles.summaryLab}>現在ポイント</p>
            <p className={spStyles.summaryVal}>
              {new Intl.NumberFormat("ja-JP").format(summary.pointsBalance)}
              <span className={spStyles.summaryUnit}>pt</span>
            </p>
          </div>
          <div className={spStyles.summaryCell}>
            <p className={spStyles.summaryLab}>残り時間</p>
            <p className={spStyles.summaryVal}>
              {new Intl.NumberFormat("ja-JP").format(summary.remainingMinutes)}
              <span className={spStyles.summaryUnit}>分</span>
            </p>
          </div>
          <div className={spStyles.summaryCell}>
            <p className={spStyles.summaryLab}>予約可能時間</p>
            <p className={spStyles.summaryVal}>
              {new Intl.NumberFormat("ja-JP").format(summary.reservableMinutes)}
              <span className={spStyles.summaryUnit}>分</span>
            </p>
            <p className={spStyles.summarySub}>レッスン予約に使える残り</p>
          </div>
          <div className={spStyles.summaryCell}>
            <p className={spStyles.summaryLab}>最近の決済日</p>
            <p className={spStyles.summaryVal} style={{ fontSize: "1.05rem" }}>
              {summary.lastPaymentPaidAt ? formatShort(summary.lastPaymentPaidAt) : "—"}
            </p>
          </div>
        </div>
      ) : null}

      <StudentPaymentsFilterBar active={activeFilter} />

      <div className={spStyles.list}>
        {filtered.map((t) => {
          const cat = jpStudentPaymentCategory(t);
          return (
            <article key={t.id} className={spStyles.historyCard}>
              <div className={spStyles.historyMeta}>{formatShort(t.paidAt)}</div>
              <h2 className={spStyles.historyTitle}>{cat}</h2>
              <div className={spStyles.historyRow}>
                <span>
                  税込{" "}
                  <span className={spStyles.historyStrong}>{new Intl.NumberFormat("ja-JP").format(Number(t.amountTaxInclusive || 0))}</span>{" "}
                  円
                </span>
                <span>
                  付与 <span className={spStyles.historyStrong}>{t.finalPoints ?? 0}</span> pt
                </span>
                <span>
                  換算 <span className={spStyles.historyStrong}>{t.grantedMinutes ?? 0}</span> 分
                </span>
              </div>
              {t.note ? <p className={spStyles.noteLine}>備考: {t.note}</p> : null}
              <div className={spStyles.actions}>
                <Link className={spStyles.actionLink} href={`/student/payments/${t.id}`}>
                  詳細を見る
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className={spStyles.emptyBox} role="status">
          <p style={{ margin: 0, fontWeight: 700 }}>表示できる決済履歴がありません</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>
            決済後、このページで履歴を確認できます。
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={spStyles.emptyBox} role="status">
          <p style={{ margin: 0, fontWeight: 700 }}>この条件に該当する履歴がありません</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>フィルタを「全体」に戻すと表示される場合があります。</p>
        </div>
      ) : null}

      <p style={{ marginTop: "1rem", fontSize: "0.88rem" }}>
        <Link href="/student" style={{ color: "var(--student-accent, #2563eb)", fontWeight: 600 }}>
          ホームへ戻る
        </Link>
      </p>
    </StudentAreaLayout>
  );
}

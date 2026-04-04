"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "../login/login.module.css";
import adminStyles from "./admin.module.css";
import v2 from "./admin-students-v2.module.css";
import { fetchAdminStudentsList } from "../../lib/adapters/adminStudentsClient";

const EMPTY_FILTERS = {
  q: "",
  registrationStatus: "",
  consentStatus: "",
  linked: "",
};

export default function AdminStudentsPanelV2({
  initialStudents,
  initialPagination,
  initialRiskByStudentId = {},
}) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [students, setStudents] = useState(initialStudents || []);
  const [pagination, setPagination] = useState(
    initialPagination || {
      page: 1,
      pageSize: 10,
      total: initialStudents?.length || 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalText = useMemo(
    () =>
      `検索結果: ${pagination.total}名（${pagination.page} / ${pagination.totalPages} ページ）`,
    [pagination.page, pagination.total, pagination.totalPages]
  );

  const rows = useMemo(() => {
    return (students || []).map((student) => {
      const registrationDone = student.registrationStatus === "completed";
      const lessonActive = Number(student.lessonMinutes?.remainingMinutes || 0) > 0;
      const recentReservation = student.recentReservationAt || "-";
      const riskBadges = initialRiskByStudentId[student.id] || [];
      return {
        ...student,
        registrationLabel: registrationDone ? "登録完了" : "登録途中",
        registrationTone: registrationDone ? "good" : "warn",
        learningLabel: lessonActive ? "受講中" : "準備中",
        learningTone: lessonActive ? "good" : "warn",
        recentReservation,
        riskBadges,
      };
    });
  }, [students, initialRiskByStudentId]);

  async function loadPage({ nextPage, nextPageSize, resetToFirstPage }) {
    setLoading(true);
    setError("");

    try {
      const page = resetToFirstPage ? 1 : nextPage;
      const pageSize = nextPageSize || pagination.pageSize;
      const data = await fetchAdminStudentsList(filters, page, pageSize);
      setStudents(data.students || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err.message || "学生一覧取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadPage({ nextPage: 1, resetToFirstPage: true });
  }

  async function handleMovePage(nextPage) {
    await loadPage({ nextPage });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setStudents(initialStudents || []);
    setPagination(
      initialPagination || {
        page: 1,
        pageSize: 10,
        total: initialStudents?.length || 0,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      }
    );
    setError("");
  }

  return (
    <section className={adminStyles.sectionBlock}>
      <form onSubmit={handleSearch} className={v2.toolbar}>
        <div className={v2.toolbarGrid}>
          <label className={styles.label}>
            検索（会員番号 / 名前 / フリガナ / メール）
            <input
              className={styles.field}
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="キーワード"
            />
          </label>

          <label className={styles.label}>
            登録状態
            <select
              className={styles.field}
              value={filters.registrationStatus}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, registrationStatus: event.target.value }))
              }
            >
              <option value="">全体</option>
              <option value="start_pending_profile">start_pending_profile</option>
              <option value="profile_pending_consent">profile_pending_consent</option>
              <option value="completed">completed</option>
            </select>
          </label>

          <label className={styles.label}>
            同意状態
            <select
              className={styles.field}
              value={filters.consentStatus}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, consentStatus: event.target.value }))
              }
            >
              <option value="">全体</option>
              <option value="pending">pending</option>
              <option value="agreed">agreed</option>
            </select>
          </label>

          <label className={styles.label}>
            アカウント連携
            <select
              className={styles.field}
              value={filters.linked}
              onChange={(event) => setFilters((prev) => ({ ...prev, linked: event.target.value }))}
            >
              <option value="">全体</option>
              <option value="linked">linked</option>
              <option value="unlinked">unlinked</option>
            </select>
          </label>
        </div>

        <div className={v2.actions}>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "検索中..." : "検索"}
          </button>
          <button className={styles.button} type="button" onClick={handleReset}>
            フィルター初期化
          </button>
          <a className={adminStyles.actionButton} href="/student/register/start">
            新規学生登録
          </a>
        </div>
      </form>

      <p className={v2.summary}>{totalText}</p>
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <div className={v2.pager}>
        <button
          className={styles.button}
          type="button"
          disabled={loading || !pagination.hasPrev}
          onClick={() => handleMovePage(pagination.page - 1)}
        >
          前へ
        </button>
        <button
          className={styles.button}
          type="button"
          disabled={loading || !pagination.hasNext}
          onClick={() => handleMovePage(pagination.page + 1)}
        >
          次へ
        </button>
      </div>

      <div className={`${adminStyles.tableWrap} ${v2.tableCard}`}>
        <table className={adminStyles.table}>
          <thead>
            <tr>
              <th>学生番号</th>
              <th>名前</th>
              <th>フリガナ</th>
              <th>メール</th>
              <th>電話番号</th>
              <th>登録状態</th>
              <th>受講状態</th>
              <th>最近の予約</th>
              <th>学習シグナル</th>
              <th>最近のログイン</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => (
              <tr key={student.id}>
                <td>{student.studentNumber || "-"}</td>
                <td>
                  {student.nameKanji || "-"}
                  <p className={adminStyles.smallMuted}>
                    ペア:{" "}
                    {student?.pairInfo?.partner
                      ? `${student.pairInfo.partner.nameKanji || "-"} (${student.pairInfo.partner.studentNumber || "-"})`
                      : "なし"}
                  </p>
                </td>
                <td>{student.nameFurigana || "-"}</td>
                <td>{student.email || "-"}</td>
                <td>{student.phone || student.crmProfile?.phoneMobile || "-"}</td>
                <td>
                  <span
                    className={`${adminStyles.statusPill} ${
                      student.registrationTone === "good" ? adminStyles.statusGood : adminStyles.statusWarn
                    }`}
                  >
                    {student.registrationLabel}
                  </span>
                </td>
                <td>
                  <span
                    className={`${adminStyles.statusPill} ${
                      student.learningTone === "good" ? adminStyles.statusGood : adminStyles.statusWarn
                    }`}
                  >
                    {student.learningLabel}
                  </span>
                </td>
                <td>{student.recentReservation}</td>
                <td className={v2.riskCell}>
                  {student.riskBadges?.length ? (
                    <div className={v2.riskBadgeRow}>
                      {student.riskBadges.map((b) => (
                        <span key={b.id} className={v2.riskBadge} data-tone={b.tone || "info"}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{student.linkedUserLastLoginAt || "-"}</td>
                <td>
                  <div className={adminStyles.inlineLinks}>
                    <a className={adminStyles.inlineLink} href={`/admin/students/${student.id}`}>
                      詳細
                    </a>
                    <a className={adminStyles.inlineLink} href={`/admin/students/${student.id}`}>
                      パスワード初期化
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11}>条件に一致する学生はいません。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className={v2.rollback}>
        一覧表示に問題がある場合は{" "}
        <Link href="/admin/students?ui=v1" prefetch={false}>
          従来の学生管理画面
        </Link>
        に切り替えられます。
      </p>
    </section>
  );
}

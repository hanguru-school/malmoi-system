"use client";

import { useEffect, useState } from "react";
import styles from "../login/login.module.css";

const DEFAULT_FILTERS = {
  action: "",
  fromDate: "",
  toDate: "",
  studentId: "",
};

function buildQuery(filters, page, pageSize) {
  const params = new URLSearchParams();
  if (filters.action) params.set("action", filters.action);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.studentId) params.set("studentId", filters.studentId);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}

export default function AdminAuditLogPanel() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  async function loadLogs(nextPage = 1, activeFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const query = buildQuery(activeFilters, nextPage, pagination.pageSize);
      const response = await fetch(`/api/admin/audit-logs?${query}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "履歴の取得に失敗しました。");
      }
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err.message || "履歴取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = String(params.get("auditAction") || "").trim();
    const nextFilters = action ? { ...DEFAULT_FILTERS, action } : DEFAULT_FILTERS;
    setFilters(nextFilters);
    (async () => {
      await loadLogs(1, nextFilters);
    })();
    // Initial load only; subsequent loads are user-triggered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    await loadLogs(1);
  }

  async function handleMovePage(nextPage) {
    await loadLogs(nextPage);
  }

  return (
    <section>
      <h2 className={styles.sectionTitle}>最新状態履歴</h2>
      <p className={styles.description}>学生登録/同意/修正/ログインに関する最近のイベントを表示します。</p>
      <form onSubmit={handleSearch}>
        <label className={styles.label}>
          アクションフィルター
          <select
            className={styles.field}
            value={filters.action}
            onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
          >
            <option value="">全体</option>
            <option value="auth.request_link">auth.request_link</option>
            <option value="auth.login_success">auth.login_success</option>
            <option value="student.registration_started">student.registration_started</option>
            <option value="student.profile_updated">student.profile_updated</option>
            <option value="student.consent_agreed">student.consent_agreed</option>
            <option value="admin.student_updated">admin.student_updated</option>
            <option value="lesson_note.teacher_assigned_bulk">lesson_note.teacher_assigned_bulk</option>
          </select>
        </label>
        <label className={styles.label}>
          開始日
          <input
            className={styles.field}
            type="date"
            value={filters.fromDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
          />
        </label>
        <label className={styles.label}>
          終了日
          <input
            className={styles.field}
            type="date"
            value={filters.toDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))}
          />
        </label>
        <label className={styles.label}>
          学生 ID
          <input
            className={styles.field}
            value={filters.studentId}
            onChange={(event) => setFilters((prev) => ({ ...prev, studentId: event.target.value }))}
            placeholder="studentId"
          />
        </label>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "検索中..." : "履歴検索"}
        </button>
      </form>
      {loading ? <p>読み込み中...</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <p className={styles.description}>
        新しい順 - {pagination.page}/{pagination.totalPages} ページ (合計 {pagination.total} 件)
      </p>
      <div className={styles.links}>
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

      <div className={styles.links}>
        {!loading && !error && logs.length === 0 ? <p>表示する履歴がありません。</p> : null}
        {logs.map((log) => (
          <p key={log.id} className={styles.message}>
            [{log.at}] {log.action} / {log.targetType} / {log.summary}
          </p>
        ))}
      </div>
    </section>
  );
}

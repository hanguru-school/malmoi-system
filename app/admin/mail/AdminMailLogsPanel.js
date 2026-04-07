"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";

const EMPTY_FILTERS = {
  type: "",
  status: "",
  toEmail: "",
  recipientName: "",
  studentName: "",
  parentName: "",
  fromDate: "",
  toDate: "",
};

const MAIL_TYPE_OPTIONS = [
  { value: "student_registration_verify", label: "学生登録確認" },
  { value: "student_registration", label: "学生登録認証(旧)" },
  { value: "auth_login_link", label: "ログインリンク" },
  { value: "password_reset", label: "パスワード再設定" },
  { value: "reservation_created", label: "予約完了" },
  { value: "reservation_confirmed", label: "予約完了(旧)" },
  { value: "reservation_updated", label: "予約変更" },
  { value: "lesson_note_published", label: "レッスンノート通知" },
  { value: "lesson_note_student", label: "レッスンノート通知(学生・旧)" },
  { value: "lesson_note_parent", label: "レッスンノート通知(保護者・旧)" },
  { value: "homework_assigned", label: "宿題通知" },
  { value: "homework_assigned_student", label: "宿題通知(学生・旧)" },
  { value: "homework_assigned_parent", label: "宿題通知(保護者・旧)" },
  { value: "notice_published", label: "お知らせ通知" },
  { value: "lesson_reminder", label: "レッスンリマインド(旧)" },
  { value: "lesson_reminder_day_before", label: "前日リマインド" },
  { value: "lesson_reminder_same_day", label: "当日リマインド" },
];

function buildQuery(filters, page, pageSize) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.toEmail) params.set("toEmail", filters.toEmail);
  if (filters.recipientName) params.set("recipientName", filters.recipientName);
  if (filters.studentName) params.set("studentName", filters.studentName);
  if (filters.parentName) params.set("parentName", filters.parentName);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}

function statusClass(status) {
  if (status === "sent") return `${adminStyles.statusPill} ${adminStyles.statusGood}`;
  if (status === "failed") return `${adminStyles.statusPill} ${adminStyles.statusBad}`;
  if (status === "retry_target") return `${adminStyles.statusPill} ${adminStyles.statusWarn}`;
  return `${adminStyles.statusPill} ${adminStyles.statusWarn}`;
}

function typeLabel(type) {
  const found = MAIL_TYPE_OPTIONS.find((item) => item.value === type);
  return found?.label || type || "-";
}

function statusLabel(status) {
  if (status === "sent") return "送信成功";
  if (status === "failed") return "送信失敗";
  if (status === "retry_target") return "再送対象";
  if (status === "queued") return "送信待ち";
  if (status === "logged") return "ログのみ";
  if (status === "disabled") return "無効";
  return status || "-";
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function metaSummary(meta) {
  if (!meta || typeof meta !== "object") return "-";
  const keys = ["purpose", "lessonDate", "teacher", "teacherName", "lessonType", "studentName", "parentName", "nextPath"];
  const chunks = keys
    .map((key) => {
      const value = meta[key];
      if (value === undefined || value === null || String(value).trim() === "") return null;
      return `${key}:${String(value).trim()}`;
    })
    .filter(Boolean);
  return chunks.length ? chunks.join(" / ") : "-";
}

export default function AdminMailLogsPanel({ initialLogs = [], initialPagination }) {
  const [activeTab, setActiveTab] = useState("logs");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [logs, setLogs] = useState(initialLogs);
  const [pagination, setPagination] = useState(
    initialPagination || { page: 1, pageSize: 40, total: initialLogs.length, totalPages: 1, hasPrev: false, hasNext: false },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [exportingVisible, setExportingVisible] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [resendingId, setResendingId] = useState("");

  const summary = useMemo(() => {
    const sentCount = (logs || []).filter((item) => item.status === "sent").length;
    const failedCount = (logs || []).filter((item) => item.status === "failed").length;
    return {
      sentCount,
      failedCount,
      latest: logs[0]?.createdAt || "-",
      retryTargetCount: (logs || []).filter((item) => item.status === "retry_target" || item.status === "failed").length,
    };
  }, [logs]);

  async function load(nextPage = 1) {
    setLoading(true);
    setError("");
    try {
      const query = buildQuery(filters, nextPage, pagination.pageSize || 40);
      const response = await fetch(`/api/admin/mail-logs?${query}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "メールログの取得に失敗しました。");
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err.message || "メールログ取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await load(1);
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setLogs(initialLogs || []);
    setPagination(initialPagination || pagination);
    setError("");
  }

  async function loadTemplates() {
    setTemplateLoading(true);
    setTemplateError("");
    try {
      const response = await fetch("/api/admin/mail-templates");
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "テンプレート取得に失敗しました。");
      setTemplates(data.items || []);
    } catch (err) {
      setTemplateError(err.message || "テンプレート取得中にエラーが発生しました。");
    } finally {
      setTemplateLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function toggleTemplateActive(type, isActive) {
    setTemplateLoading(true);
    setTemplateError("");
    try {
      const response = await fetch("/api/admin/mail-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, isActive }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "テンプレート更新に失敗しました。");
      await loadTemplates();
    } catch (err) {
      setTemplateError(err.message || "テンプレート更新中にエラーが発生しました。");
      setTemplateLoading(false);
    }
  }

  async function resendMail(logId) {
    setResendingId(logId);
    setError("");
    try {
      const response = await fetch(`/api/admin/mail-logs/${encodeURIComponent(logId)}/resend`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "再送に失敗しました。");
      await load(pagination.page || 1);
      setSelectedLog(null);
    } catch (err) {
      setError(err.message || "再送中にエラーが発生しました。");
    } finally {
      setResendingId("");
    }
  }

  async function applyFailedOnly() {
    setFilters((prev) => ({ ...prev, status: "failed" }));
    setLoading(true);
    setError("");
    try {
      const query = buildQuery({ ...filters, status: "failed" }, 1, pagination.pageSize || 40);
      const response = await fetch(`/api/admin/mail-logs?${query}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "メールログの取得に失敗しました。");
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err.message || "メールログ取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  function toCsvContent(targetLogs) {
    const header = ["種類", "宛先", "送信日時", "状態", "件名", "補足", "エラー", "メッセージID", "リンク"];
    const rows = (targetLogs || []).map((log) => [
      typeLabel(log.type),
      log.toEmail || "",
      log.createdAt || "",
      statusLabel(log.status),
      log.subject || "",
      metaSummary(log.meta),
      log.error || "",
      log.messageId || "",
      log.linkUrl || "",
    ]);
    return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  }

  function downloadCsv(csvText, suffix) {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `malmoi-mail-logs-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportVisibleCsv() {
    setExportingVisible(true);
    try {
      const csv = toCsvContent(logs || []);
      downloadCsv(csv, "visible");
    } finally {
      setExportingVisible(false);
    }
  }

  async function handleExportAllCsv() {
    setExportingAll(true);
    setError("");
    try {
      const pageSize = 100;
      let currentPage = 1;
      let hasNext = true;
      const allRows = [];
      let guard = 0;

      while (hasNext && guard < 200) {
        const query = buildQuery(filters, currentPage, pageSize);
        const response = await fetch(`/api/admin/mail-logs?${query}`);
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "CSV出力用メールログの取得に失敗しました。");
        }
        allRows.push(...(data.logs || []));
        hasNext = Boolean(data.pagination?.hasNext);
        currentPage += 1;
        guard += 1;
      }
      const csv = toCsvContent(allRows);
      downloadCsv(csv, "all");
    } catch (err) {
      setError(err.message || "CSV出力中にエラーが発生しました。");
    } finally {
      setExportingAll(false);
    }
  }

  const canResend = (log) =>
    ["failed", "retry_target", "disabled"].includes(String(log?.status || "")) &&
    ["student_registration_verify", "password_reset", "lesson_note_published", "homework_assigned", "notice_published", "auth_login_link"].includes(
      String(log?.type || "")
    );

  const relatedLinks = (log) => {
    const links = [];
    if (log?.relatedStudentId) links.push({ href: `/admin/students/${encodeURIComponent(log.relatedStudentId)}`, label: "学生" });
    if (log?.relatedReservationId) links.push({ href: `/admin/reservations`, label: `予約(${log.relatedReservationId.slice(0, 8)})` });
    if (log?.relatedLessonNoteId) links.push({ href: `/admin/lesson-notes`, label: `ノート(${log.relatedLessonNoteId.slice(0, 8)})` });
    if (log?.relatedNoticeId) links.push({ href: `/admin/notices`, label: `お知らせ(${log.relatedNoticeId.slice(0, 8)})` });
    return links;
  };

  return (
    <section className={adminStyles.sectionBlock}>
      <div className={adminStyles.compactActions}>
        <button
          className={activeTab === "logs" ? adminStyles.chipButtonActive : adminStyles.chipButton}
          type="button"
          onClick={() => setActiveTab("logs")}
        >
          送信履歴
        </button>
        <button
          className={activeTab === "templates" ? adminStyles.chipButtonActive : adminStyles.chipButton}
          type="button"
          onClick={() => setActiveTab("templates")}
        >
          テンプレート管理
        </button>
      </div>

      {activeTab === "logs" ? (
        <>
      <div className={styles.infoCard}>
        <p>直近送信件数: {logs.length} 件</p>
        <p>送信成功: {summary.sentCount} 件</p>
        <p>送信失敗: {summary.failedCount} 件</p>
        <p>再送対象: {summary.retryTargetCount} 件</p>
        <p>最新送信時刻: {summary.latest}</p>
        <div className={adminStyles.compactActions}>
          <button className={adminStyles.chipButton} type="button" onClick={applyFailedOnly} disabled={loading}>
            失敗ログのみ表示
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className={adminStyles.compactFormGrid}>
        <label className={styles.label}>
          種類
          <select
            className={styles.field}
            value={filters.type}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="">全体</option>
            {MAIL_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          状態
          <select
            className={styles.field}
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">全体</option>
            <option value="sent">送信成功</option>
            <option value="failed">送信失敗</option>
            <option value="logged">ログのみ</option>
            <option value="disabled">無効</option>
          </select>
        </label>

        <label className={styles.label}>
          宛先
          <input
            className={styles.field}
            value={filters.toEmail}
            onChange={(event) => setFilters((prev) => ({ ...prev, toEmail: event.target.value }))}
            placeholder="example@domain.com"
          />
        </label>
        <label className={styles.label}>
          対象者名
          <input
            className={styles.field}
            value={filters.recipientName}
            onChange={(event) => setFilters((prev) => ({ ...prev, recipientName: event.target.value }))}
            placeholder="対象者名"
          />
        </label>
        <label className={styles.label}>
          学生検索
          <input
            className={styles.field}
            value={filters.studentName}
            onChange={(event) => setFilters((prev) => ({ ...prev, studentName: event.target.value }))}
            placeholder="学生名"
          />
        </label>
        <label className={styles.label}>
          保護者検索
          <input
            className={styles.field}
            value={filters.parentName}
            onChange={(event) => setFilters((prev) => ({ ...prev, parentName: event.target.value }))}
            placeholder="保護者名"
          />
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

        <div className={adminStyles.compactActions}>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "検索中..." : "検索"}
          </button>
          <button className={styles.button} type="button" onClick={handleReset}>
            リセット
          </button>
          <button className={styles.button} type="button" onClick={handleExportVisibleCsv} disabled={exportingVisible}>
            {exportingVisible ? "出力中..." : "CSV(表示中)出力"}
          </button>
          <button className={styles.button} type="button" onClick={handleExportAllCsv} disabled={exportingAll}>
            {exportingAll ? "出力中..." : "CSV(全件)出力"}
          </button>
        </div>
      </form>

      <p className={styles.description}>
        合計 {pagination.total} 件 / {pagination.page} / {pagination.totalPages} ページ
      </p>
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <div className={adminStyles.tableWrap}>
        <table className={adminStyles.table}>
          <thead>
            <tr>
              <th>送信日時</th>
              <th>種類</th>
              <th>宛先</th>
              <th>対象者名</th>
              <th>状態</th>
              <th>件名</th>
              <th>関連情報</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt || "-"}</td>
                <td>{typeLabel(log.type)}</td>
                <td>{log.recipientEmail || log.toEmail || "-"}</td>
                <td>{log.recipientName || log.meta?.studentName || log.meta?.parentName || "-"}</td>
                <td>
                  <span className={statusClass(log.status)}>{statusLabel(log.status)}</span>
                </td>
                <td>{log.subject || "-"}</td>
                <td>
                  {relatedLinks(log).length > 0 ? (
                    <div className={adminStyles.inlineLinks}>
                      {relatedLinks(log).map((item) => (
                        <Link key={`${log.id}-${item.label}`} className={adminStyles.inlineLink} href={item.href}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className={adminStyles.smallMuted}>-</p>
                  )}
                  <p className={adminStyles.smallMuted}>補足: {metaSummary(log.meta)}</p>
                </td>
                <td>
                  <button
                    className={adminStyles.inlineLinkButton}
                    type="button"
                    onClick={() => setSelectedLog(log)}
                  >
                    詳細
                  </button>
                  {canResend(log) ? (
                    <button
                      className={adminStyles.inlineLinkButton}
                      type="button"
                      disabled={resendingId === log.id}
                      onClick={() => resendMail(log.id)}
                    >
                      {resendingId === log.id ? "再送中..." : "再送する"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8}>メールログはまだありません。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className={adminStyles.compactActions}>
        <button
          className={styles.button}
          type="button"
          disabled={loading || !pagination.hasPrev}
          onClick={() => load(Math.max(1, pagination.page - 1))}
        >
          前へ
        </button>
        <button
          className={styles.button}
          type="button"
          disabled={loading || !pagination.hasNext}
          onClick={() => load(Math.min(pagination.totalPages || 1, pagination.page + 1))}
        >
          次へ
        </button>
      </div>

      {selectedLog ? (
        <div className={adminStyles.modalOverlay} role="dialog" aria-modal="true">
          <div className={adminStyles.modalCard}>
            <h3 className={adminStyles.groupTitle}>メール詳細</h3>
            <p className={adminStyles.smallMuted}>種類: {typeLabel(selectedLog.type)}</p>
            <p className={adminStyles.smallMuted}>テンプレート: {selectedLog.templateName || "-"}</p>
            <p className={adminStyles.smallMuted}>宛先: {selectedLog.recipientEmail || selectedLog.toEmail || "-"}</p>
            <p className={adminStyles.smallMuted}>対象者名: {selectedLog.recipientName || "-"}</p>
            <p className={adminStyles.smallMuted}>対象者種別: {selectedLog.recipientRole || "-"}</p>
            <p className={adminStyles.smallMuted}>送信日時: {selectedLog.createdAt || "-"}</p>
            <p className={adminStyles.smallMuted}>送信成功時刻: {selectedLog.sentAt || "-"}</p>
            <p className={adminStyles.smallMuted}>失敗時刻: {selectedLog.failedAt || "-"}</p>
            <p className={adminStyles.smallMuted}>状態: {statusLabel(selectedLog.status)}</p>
            <p className={adminStyles.smallMuted}>件名: {selectedLog.subject || "-"}</p>
            <p className={adminStyles.smallMuted}>messageId: {selectedLog.messageId || "-"}</p>
            <p className={adminStyles.smallMuted}>リンク: {selectedLog.linkUrl || "-"}</p>
            {selectedLog.errorMessage ? <p className={adminStyles.smallMuted}>error: {selectedLog.errorMessage}</p> : null}
            <p className={adminStyles.smallMuted}>関連学生: {selectedLog.relatedStudentId || "-"}</p>
            <p className={adminStyles.smallMuted}>関連保護者: {selectedLog.relatedParentId || "-"}</p>
            <p className={adminStyles.smallMuted}>関連予約: {selectedLog.relatedReservationId || "-"}</p>
            <p className={adminStyles.smallMuted}>関連ノート: {selectedLog.relatedLessonNoteId || "-"}</p>
            <p className={adminStyles.smallMuted}>関連お知らせ: {selectedLog.relatedNoticeId || "-"}</p>
            <p className={adminStyles.smallMuted}>本文プレビュー:</p>
            <pre className={adminStyles.metaPre}>{selectedLog.bodyPreviewText || "-"}</pre>
            <pre className={adminStyles.metaPre}>{JSON.stringify(selectedLog.meta || {}, null, 2)}</pre>
            <div className={adminStyles.compactActions}>
              {canResend(selectedLog) ? (
                <button
                  className={styles.button}
                  type="button"
                  disabled={resendingId === selectedLog.id}
                  onClick={() => resendMail(selectedLog.id)}
                >
                  {resendingId === selectedLog.id ? "再送中..." : "再送する"}
                </button>
              ) : null}
              <button className={styles.button} type="button" onClick={() => setSelectedLog(null)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </>
      ) : (
        <section>
          <h3 className={styles.sectionTitle}>メールテンプレート管理</h3>
          <p className={styles.description}>テンプレートの使用状況を確認し、有効/無効を切り替えできます。</p>
          {templateError ? <p className={`${styles.message} ${styles.messageError}`}>{templateError}</p> : null}
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>テンプレート名</th>
                  <th>種類</th>
                  <th>件名</th>
                  <th>使用中</th>
                  <th>最終更新</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((item) => (
                  <tr key={item.type}>
                    <td>{item.templateName || item.type}</td>
                    <td>{item.label}</td>
                    <td>{item.defaultSubject || "-"}</td>
                    <td>
                      <span className={item.isActive ? `${adminStyles.statusPill} ${adminStyles.statusGood}` : `${adminStyles.statusPill} ${adminStyles.statusBad}`}>
                        {item.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                    <td>{item.updatedAt || "-"}</td>
                    <td>
                      <button
                        className={adminStyles.inlineLinkButton}
                        type="button"
                        disabled={templateLoading}
                        onClick={() => setTemplatePreview(item)}
                      >
                        プレビュー
                      </button>
                      <button
                        className={adminStyles.inlineLinkButton}
                        type="button"
                        disabled={templateLoading}
                        onClick={() => toggleTemplateActive(item.type, !item.isActive)}
                      >
                        {item.isActive ? "無効化" : "有効化"}
                      </button>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={6}>テンプレート情報がありません。</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {templatePreview ? (
        <div className={adminStyles.modalOverlay} role="dialog" aria-modal="true">
          <div className={adminStyles.modalCard}>
            <h3 className={adminStyles.groupTitle}>テンプレートプレビュー</h3>
            <p className={adminStyles.smallMuted}>種類: {templatePreview.label}</p>
            <p className={adminStyles.smallMuted}>件名: {templatePreview.defaultSubject || "-"}</p>
            <article className={styles.noticeSimpleCard}>
              <p className={styles.noticeSimpleTitle}>MalMoi 韓国語教室</p>
              <p className={styles.noticeSimpleSummary}>これはテンプレート表示用プレビューです。</p>
              <p className={styles.noticeSimpleSummary}>{templatePreview.defaultSubject || "-"}</p>
              <button className={styles.button} type="button">メインボタン(プレビュー)</button>
            </article>
            <div className={adminStyles.compactActions}>
              <button className={styles.button} type="button" onClick={() => setTemplatePreview(null)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}


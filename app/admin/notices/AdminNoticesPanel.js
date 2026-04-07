"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../login/login.module.css";

const EMPTY_FORM = {
  id: "",
  title: "",
  summary: "",
  content: "",
  isImportant: false,
  isActive: true,
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminNoticesPanel() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [form, setForm] = useState(EMPTY_FORM);

  const isEdit = Boolean(form.id);
  const sortedNotices = useMemo(
    () => [...notices].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))),
    [notices]
  );

  async function load() {
    setLoading(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/admin/notices", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "お知らせ一覧の取得に失敗しました。");
      setNotices(data.notices || []);
    } catch (error) {
      setStatus({ type: "error", text: error.message || "読み込み中にエラーが発生しました。" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const method = isEdit ? "PATCH" : "POST";
      const url = isEdit ? `/api/admin/notices/${form.id}` : "/api/admin/notices";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          content: form.content,
          isImportant: form.isImportant,
          isActive: form.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "保存に失敗しました。");
      setStatus({ type: "ok", text: isEdit ? "お知らせを更新しました。" : "お知らせを作成しました。" });
      resetForm();
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存中にエラーが発生しました。" });
    } finally {
      setSaving(false);
    }
  }

  async function removeNotice(id) {
    if (!window.confirm("このお知らせを削除しますか？")) return;
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "削除に失敗しました。");
      setStatus({ type: "ok", text: "お知らせを削除しました。" });
      if (form.id === id) resetForm();
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "削除中にエラーが発生しました。" });
    }
  }

  async function toggleActive(notice) {
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch(`/api/admin/notices/${notice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !notice.isActive }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "公開状態の更新に失敗しました。");
      setStatus({ type: "ok", text: "公開状態を更新しました。" });
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "更新中にエラーが発生しました。" });
    }
  }

  return (
    <>
      <form onSubmit={submitForm}>
        <label className={styles.label}>
          タイトル
          <input
            className={styles.field}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
        </label>
        <label className={styles.label}>
          要約 (任意)
          <input
            className={styles.field}
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
          />
        </label>
        <label className={styles.label}>
          本文
          <textarea
            className={styles.field}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            rows={6}
          />
        </label>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={form.isImportant}
            onChange={(e) => setForm((prev) => ({ ...prev, isImportant: e.target.checked }))}
          />
          重要お知らせ
        </label>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          公開する
        </label>
        <div className={styles.links}>
          <button className={styles.button} type="submit" disabled={saving}>
            {saving ? "保存中..." : isEdit ? "お知らせ更新" : "お知らせ作成"}
          </button>
          {isEdit ? (
            <button className={styles.button} type="button" onClick={resetForm}>
              新規作成に戻る
            </button>
          ) : null}
        </div>
      </form>

      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
          {status.text}
        </p>
      ) : null}

      <h2 className={styles.sectionTitle}>お知らせ一覧</h2>
      {loading ? <p className={styles.description}>読み込み中...</p> : null}
      <div className={styles.links}>
        {sortedNotices.map((notice) => (
          <div key={notice.id} className={styles.message}>
            <p>
              <strong>{notice.title}</strong> {notice.isImportant ? "【重要】" : ""}
            </p>
            <p>公開状態: {notice.isActive ? "公開" : "非公開"}</p>
            <p>公開日時: {formatDate(notice.publishedAt)}</p>
            <p>更新日時: {formatDate(notice.updatedAt)}</p>
            <p>{notice.summary || notice.content || "-"}</p>
            <div className={styles.links}>
              <button className={styles.button} type="button" onClick={() => setForm({
                id: notice.id,
                title: notice.title || "",
                summary: notice.summary || "",
                content: notice.content || "",
                isImportant: notice.isImportant === true,
                isActive: notice.isActive !== false,
              })}>
                修正
              </button>
              <button className={styles.button} type="button" onClick={() => toggleActive(notice)}>
                {notice.isActive ? "非公開にする" : "公開する"}
              </button>
              <button className={styles.button} type="button" onClick={() => removeNotice(notice.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
        {!loading && sortedNotices.length === 0 ? <p>登録済みのお知らせはありません。</p> : null}
      </div>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "../../login/login.module.css";
import {
  HW_QUICK_PRESETS,
  HW_PREFILL_FROM_NOTE_KEY,
  getRecentQuickHomeworks,
  pushRecentQuickHomework,
} from "../../../lib/homework/quickHomework";
import { completeOpsFlowStep, opsFlowDoneFallback } from "../../../lib/ops/opsFlowQueue";
import {
  recordTeacherPresetUse,
  recordTeacherRecentHwUse,
  recordTeacherTemplateUse,
  sortHomeworkTemplateRowsByUsage,
  sortPresetIdsByUsage,
} from "../../../lib/teacher/teacherUiUsage";

const HOMEWORK_TYPES = [
  { id: "vocabulary", label: "単語" },
  { id: "grammar", label: "文法" },
  { id: "writing", label: "作文" },
  { id: "conversation", label: "会話練習" },
  { id: "pronunciation", label: "発音練習" },
  { id: "reading", label: "読解" },
  { id: "listening", label: "聞き取り" },
  { id: "free", label: "自由課題" },
];

const HOMEWORK_STATUSES = [
  { id: "not_started", label: "未着手" },
  { id: "in_progress", label: "取組中" },
  { id: "submitted", label: "提出済み" },
  { id: "reviewed", label: "確認済み" },
  { id: "completed", label: "完了" },
];

function typeLabel(type) {
  return HOMEWORK_TYPES.find((item) => item.id === type)?.label || "自由課題";
}

function statusLabel(status) {
  return HOMEWORK_STATUSES.find((item) => item.id === status)?.label || "未着手";
}

function statusClass(status) {
  if (status === "not_started") return styles.reservationStatusPending;
  if (status === "in_progress") return styles.reservationStatusScheduled;
  if (status === "submitted") return styles.reservationStatusCompleted;
  if (status === "reviewed") return styles.reservationStatusConfirmed;
  if (status === "completed") return styles.reservationStatusAttended;
  return styles.reservationStatusCancelled;
}

export default function AdminHomeworkPanel({
  initialLessonUnitId = "",
  initialStudentId = "",
  initialLessonDate = "",
  mode = "admin",
}) {
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    studentId: String(initialStudentId || "").trim(),
    teacherUserId: "",
    status: "",
    type: "",
    fromDate: "",
    toDate: "",
    lessonUnitId: initialLessonUnitId || "",
  });
  const [copyFromId, setCopyFromId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("reviewed");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [recentHwTick, setRecentHwTick] = useState(0);
  const [usageTick, setUsageTick] = useState(0);
  const prefillFromNoteAppliedRef = useRef(false);
  const [form, setForm] = useState({
    studentId: initialStudentId || "",
    lessonDate: initialLessonDate || "",
    lessonUnitId: initialLessonUnitId || "",
    reservationId: "",
    title: "",
    description: "",
    type: "free",
    dueDate: "",
    teacherMemo: "",
    status: "not_started",
    isPublished: true,
  });

  const apiBase = "/api/admin/homework";
  const isTeacherMode = mode === "teacher";
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const recentQuickHomeworks = useMemo(() => {
    return getRecentQuickHomeworks();
  }, [recentHwTick]);

  const orderedQuickPresets = useMemo(() => {
    const ids = sortPresetIdsByUsage(HW_QUICK_PRESETS);
    const map = new Map(HW_QUICK_PRESETS.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [usageTick, recentHwTick]);

  const orderedHomeworkTemplates = useMemo(() => {
    return sortHomeworkTemplateRowsByUsage(templates);
  }, [templates, usageTick]);

  const filteredSummary = useMemo(() => {
    const notStarted = items.filter((item) => item.status === "not_started").length;
    const submitted = items.filter((item) => item.status === "submitted").length;
    const reviewedPending = items.filter((item) => item.status === "submitted" || item.status === "in_progress").length;
    return { total: items.length, notStarted, submitted, reviewedPending };
  }, [items]);

  async function loadItems() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const response = await fetch(`${apiBase}?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "宿題一覧を取得できませんでした。");
    setItems(data.items || []);
  }

  async function loadLookup() {
    const studentEndpoint = isTeacherMode ? "/api/teacher/students" : "/api/admin/students?page=1&pageSize=300";
    const [studentRes, teacherRes] = await Promise.all([
      fetch(studentEndpoint),
      isTeacherMode ? Promise.resolve(null) : fetch("/api/admin/teacher-users"),
    ]);
    const studentData = await studentRes.json();
    if (studentRes.ok && studentData?.ok) setStudents(studentData.students || []);
    if (!isTeacherMode && teacherRes) {
      const teacherData = await teacherRes.json();
      if (teacherRes.ok && teacherData?.ok) setTeachers(teacherData.teachers || []);
    }
  }

  async function loadTemplates() {
    const response = await fetch("/api/admin/homework-templates");
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "テンプレート取得に失敗しました。");
    setTemplates(data.items || []);
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadItems(), loadLookup(), loadTemplates()]);
    } catch (err) {
      setError(err.message || "データ取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prefillFromNoteAppliedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(HW_PREFILL_FROM_NOTE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (!p || p.v !== 1) return;
      if (Date.now() - (p.ts || 0) > 45 * 60 * 1000) {
        window.sessionStorage.removeItem(HW_PREFILL_FROM_NOTE_KEY);
        return;
      }
      const expectSid = String(initialStudentId || "").trim();
      if (expectSid && p.studentId && p.studentId !== expectSid) return;
      prefillFromNoteAppliedRef.current = true;
      window.sessionStorage.removeItem(HW_PREFILL_FROM_NOTE_KEY);
      setForm((prev) => ({
        ...prev,
        studentId: p.studentId || prev.studentId,
        lessonUnitId: p.lessonUnitId || prev.lessonUnitId,
        lessonDate: p.lessonDate || prev.lessonDate,
        dueDate: p.dueDate || prev.dueDate,
        title: p.title || prev.title,
        description: p.description || prev.description,
        type: p.type || prev.type,
      }));
    } catch {
      // ignore
    }
  }, [initialStudentId, initialLessonUnitId, initialLessonDate]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  useEffect(() => {
    if (!isTeacherMode || !items.length) return;
    if (!items.every((item) => String(item.status) === "submitted")) return;
    const ids = items.map((item) => item.id);
    setSelectedIds((prev) => {
      if (prev.length === ids.length && ids.every((id) => prev.includes(id))) return prev;
      return ids;
    });
  }, [items, isTeacherMode]);

  async function handleSearch(event) {
    event.preventDefault();
    await loadItems();
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "宿題追加に失敗しました。");
      pushRecentQuickHomework({
        title: form.title,
        description: form.description,
        type: form.type,
      });
      setRecentHwTick((n) => n + 1);
      setForm((prev) => ({
        ...prev,
        reservationId: "",
        title: "",
        description: "",
        teacherMemo: "",
      }));
      await loadItems();
      const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      const flow = completeOpsFlowStep(pathname, searchStr);
      if (flow.done && flow.matched) {
        window.location.assign(opsFlowDoneFallback(flow.role));
        return;
      }
      if (flow.next) {
        window.location.assign(flow.next);
        return;
      }
    } catch (err) {
      setError(err.message || "宿題追加中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  function applyQuickPreset(presetId) {
    recordTeacherPresetUse(presetId);
    setUsageTick((n) => n + 1);
    const p = HW_QUICK_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setForm((prev) => ({
      ...prev,
      title: p.title,
      description: p.description,
      type: p.type,
    }));
  }

  function applyRecentQuick(entry) {
    if (!entry) return;
    recordTeacherRecentHwUse();
    setUsageTick((n) => n + 1);
    setForm((prev) => ({
      ...prev,
      title: entry.title,
      description: entry.description,
      type: entry.type || prev.type,
    }));
  }

  function handleCopyFromPrevious() {
    if (!copyFromId) return;
    const target = items.find((item) => item.id === copyFromId);
    if (!target) return;
    setForm((prev) => ({
      ...prev,
      studentId: target.studentId || prev.studentId,
      lessonDate: target.lessonDate || prev.lessonDate,
      lessonUnitId: target.lessonUnitId || prev.lessonUnitId,
      reservationId: target.reservationId || "",
      title: target.title || prev.title,
      description: target.description || prev.description,
      type: target.type || prev.type,
      dueDate: target.dueDate || "",
      teacherMemo: target.teacherMemo || "",
      status: "not_started",
    }));
  }

  async function handlePatch(id, patch) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "更新に失敗しました。");
      setEditingId("");
      await loadItems();
      const st = String(patch?.status || "");
      if (st === "reviewed" || st === "completed") {
        const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
        const flow = completeOpsFlowStep(pathname, searchStr);
        if (flow.done && flow.matched) {
          window.location.assign(opsFlowDoneFallback(flow.role));
          return;
        }
        if (flow.next) {
          window.location.assign(flow.next);
        }
      }
    } catch (err) {
      setError(err.message || "更新中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkStatusUpdate() {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/homework/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeworkIds: selectedIds,
          status: bulkStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "一括更新に失敗しました。");
      setSelectedIds([]);
      await loadItems();
    } catch (err) {
      setError(err.message || "一括更新中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  function applyTemplate() {
    if (!selectedTemplateId) return;
    recordTeacherTemplateUse(selectedTemplateId);
    setUsageTick((n) => n + 1);
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      title: template.title || prev.title,
      description: template.description || prev.description,
      type: template.type || prev.type,
      teacherMemo: template.teacherMemo || prev.teacherMemo,
    }));
  }

  async function saveCurrentAsTemplate() {
    if (!form.title || !form.description) {
      setError("テンプレート保存にはタイトルと内容が必要です。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/homework-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          teacherMemo: form.teacherMemo,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "テンプレート保存に失敗しました。");
      await loadTemplates();
    } catch (err) {
      setError(err.message || "テンプレート保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/homework-templates/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "テンプレート削除に失敗しました。");
      if (selectedTemplateId === id) setSelectedTemplateId("");
      await loadTemplates();
    } catch (err) {
      setError(err.message || "テンプレート削除中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("この宿題を削除しますか？")) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "削除に失敗しました。");
      await loadItems();
    } catch (err) {
      setError(err.message || "削除中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSearch}>
        <h2 className={styles.sectionTitle}>絞り込み</h2>
        <label className={styles.label}>
          学生検索
          <input
            className={styles.field}
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            placeholder="学生名 / 学生番号 / 宿題タイトル"
          />
        </label>
        <label className={styles.label}>
          学生
          <select
            className={styles.field}
            value={filters.studentId}
            onChange={(e) => setFilters((prev) => ({ ...prev, studentId: e.target.value }))}
          >
            <option value="">全体</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {(student.nameKanji || "-") + " / " + (student.studentNumber || "-")}
              </option>
            ))}
          </select>
        </label>
        {!isTeacherMode ? (
          <label className={styles.label}>
            講師
            <select
              className={styles.field}
              value={filters.teacherUserId}
              onChange={(e) => setFilters((prev) => ({ ...prev, teacherUserId: e.target.value }))}
            >
              <option value="">全体</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.displayName || teacher.email}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={styles.label}>
          状態
          <select
            className={styles.field}
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">全体</option>
            {HOMEWORK_STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          宿題種類
          <select
            className={styles.field}
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="">全体</option>
            {HOMEWORK_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          日付(開始)
          <input
            className={styles.field}
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
          />
        </label>
        <label className={styles.label}>
          日付(終了)
          <input
            className={styles.field}
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
          />
        </label>
        <button className={styles.button} type="submit" disabled={loading}>
          絞り込み
        </button>
      </form>

      <article className={styles.noticeSimpleCard}>
        <p className={styles.noticeSimpleTitle}>運用サマリー</p>
        <p className={styles.noticeSimpleSummary}>
          全体 {filteredSummary.total}件 / 未着手 {filteredSummary.notStarted}件 / 提出済み{" "}
          {filteredSummary.submitted}件 / 確認必要 {filteredSummary.reviewedPending}件
        </p>
        <div className={styles.reservationActions}>
          <select className={styles.field} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            {HOMEWORK_STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
          <button
            className={styles.button}
            type="button"
            disabled={saving || selectedIds.length === 0}
            onClick={handleBulkStatusUpdate}
          >
            選択{selectedIds.length}件を一括更新
          </button>
        </div>
      </article>

      <form id="admin-homework-create-form" onSubmit={handleCreate}>
        <h2 className={styles.sectionTitle}>宿題追加</h2>
        {isTeacherMode ? (
          <p className={styles.description}>
            レッスンノート保存後にこの画面へ来た場合、宿題欄にノートの要約が引き継がれることがあります（sessionStorage、約45分有効）。
          </p>
        ) : null}
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.65rem 0.75rem",
            borderRadius: "12px",
            border: "1px solid rgba(148, 163, 184, 0.45)",
            background: "rgba(248, 250, 252, 0.95)",
          }}
        >
          <p className={styles.description} style={{ marginTop: 0 }}>
            クイック定型（タイトル・内容・種類を一括）
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
            {orderedQuickPresets.map((preset) => (
              <button
                key={preset.id}
                className={styles.button}
                type="button"
                onClick={() => applyQuickPreset(preset.id)}
                style={{ fontSize: "0.8rem", padding: "0.26rem 0.55rem" }}
              >
                {preset.title}
              </button>
            ))}
          </div>
          {recentQuickHomeworks.length > 0 ? (
            <>
              <p className={styles.description} style={{ margin: "0.35rem 0" }}>
                直近に登録した宿題を再利用
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {recentQuickHomeworks.map((entry, idx) => (
                  <button
                    key={`${entry.title}-${idx}`}
                    className={styles.button}
                    type="button"
                    onClick={() => applyRecentQuick(entry)}
                    style={{ fontSize: "0.76rem", padding: "0.22rem 0.5rem", maxWidth: "100%" }}
                    title={entry.description}
                  >
                    {entry.title.length > 36 ? `${entry.title.slice(0, 36)}…` : entry.title}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <label className={styles.label}>
          学生
          <select
            className={styles.field}
            value={form.studentId}
            onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
            required
          >
            <option value="">選択してください</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {(student.nameKanji || "-") + " / " + (student.studentNumber || "-")}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          関連レッスン日
          <input
            className={styles.field}
            type="date"
            value={form.lessonDate}
            onChange={(e) => setForm((prev) => ({ ...prev, lessonDate: e.target.value }))}
          />
        </label>
        <label className={styles.label}>
          提出期限（任意・ノート連携時は自動）
          <input
            className={styles.field}
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
        </label>
        <label className={styles.label}>
          レッスン単位ID (任意)
          <input
            className={styles.field}
            value={form.lessonUnitId}
            onChange={(e) => setForm((prev) => ({ ...prev, lessonUnitId: e.target.value }))}
            placeholder="lessonUnitId"
          />
        </label>
        <label className={styles.label}>
          宿題タイトル
          <input
            className={styles.field}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
        </label>
        <label className={styles.label}>
          テンプレート
          <div className={styles.reservationActions}>
            <select
              className={styles.field}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">選択してください</option>
              {orderedHomeworkTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <button className={styles.button} type="button" onClick={applyTemplate}>
              テンプレート適用
            </button>
            <button className={styles.button} type="button" onClick={saveCurrentAsTemplate} disabled={saving}>
              現在内容をテンプレート保存
            </button>
            {selectedTemplateId ? (
              <button
                className={styles.button}
                type="button"
                onClick={() => deleteTemplate(selectedTemplateId)}
                disabled={saving}
              >
                テンプレート削除
              </button>
            ) : null}
          </div>
        </label>
        <label className={styles.label}>
          以前の宿題をコピー
          <div className={styles.reservationActions}>
            <select className={styles.field} value={copyFromId} onChange={(e) => setCopyFromId(e.target.value)}>
              <option value="">選択してください</option>
              {items.slice(0, 40).map((item) => (
                <option key={item.id} value={item.id}>
                  {(item.studentName || "-") + " / " + (item.title || "-")}
                </option>
              ))}
            </select>
            <button className={styles.button} type="button" onClick={handleCopyFromPrevious}>
              コピー適用
            </button>
          </div>
        </label>
        <label className={styles.label}>
          宿題内容
          <textarea
            className={styles.field}
            rows={4}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
        </label>
        <label className={styles.label}>
          種類
          <select
            className={styles.field}
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            {HOMEWORK_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          マイページ公開
          <select
            className={styles.field}
            value={form.isPublished ? "1" : "0"}
            onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.value === "1" }))}
          >
            <option value="1">公開</option>
            <option value="0">非公開</option>
          </select>
        </label>
        <div className={styles.reservationActions}>
          <button className={styles.button} type="submit" disabled={saving}>
            {saving ? "保存中..." : "宿題追加"}
          </button>
          {isTeacherMode ? (
            <button
              className={styles.button}
              type="button"
              disabled={saving || !form.studentId || !form.title?.trim() || !form.description?.trim()}
              onClick={() => {
                const el = document.getElementById("admin-homework-create-form");
                if (el) el.requestSubmit();
              }}
            >
              推奨内容で登録（1クリック）
            </button>
          ) : null}
        </div>
      </form>

      <h2 className={styles.sectionTitle}>宿題一覧</h2>
      {loading ? <p>読み込み中...</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <div className={styles.links}>
        {items.map((item) => (
          <article key={item.id} className={styles.reservationCard}>
            <div className={styles.reservationCardHead}>
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedIds((prev) =>
                    checked ? [...new Set([...prev, item.id])] : prev.filter((id) => id !== item.id)
                  );
                }}
              />
              <p className={styles.reservationDate}>{item.studentName || "-"}</p>
              <p className={styles.reservationTime}>{item.lessonDate || "-"}</p>
              <span className={`${styles.reservationStatusBadge} ${statusClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>
            <div className={styles.reservationMeta}>
              <p>宿題: {item.title}</p>
              <p>種類: {typeLabel(item.type)}</p>
              <p>講師: {item.teacherName || "-"}</p>
              <p>公開: {item.isPublished ? "公開" : "非公開"}</p>
              <p>関連レッスン: {item.lessonUnitId || "-"}</p>
              {item.relatedLessonNoteId ? <p>レッスンノート連携: あり</p> : <p>レッスンノート連携: なし</p>}
            </div>
            {editingId === item.id ? (
              <div className={styles.reservationActions}>
                <select
                  className={styles.field}
                  defaultValue={item.status}
                  onChange={(e) => handlePatch(item.id, { status: e.target.value })}
                >
                  {HOMEWORK_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button className={styles.button} type="button" onClick={() => setEditingId("")}>
                  閉じる
                </button>
              </div>
            ) : (
              <div className={styles.reservationActions}>
                {item.status === "submitted" ? (
                  <button
                    className={styles.button}
                    type="button"
                    disabled={saving}
                    onClick={() => handlePatch(item.id, { status: "reviewed" })}
                  >
                    確認済みにする
                  </button>
                ) : null}
                <button className={styles.button} type="button" onClick={() => setEditingId(item.id)}>
                  状態変更
                </button>
                <button className={styles.button} type="button" onClick={() => handlePatch(item.id, { isPublished: !item.isPublished })}>
                  {item.isPublished ? "非公開へ" : "公開へ"}
                </button>
                <button className={styles.button} type="button" onClick={() => handleDelete(item.id)}>
                  削除
                </button>
              </div>
            )}
          </article>
        ))}
        {!loading && items.length === 0 ? <p>表示できる宿題がありません。</p> : null}
      </div>
    </>
  );
}

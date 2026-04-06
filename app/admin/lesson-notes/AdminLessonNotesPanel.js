"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "../../login/login.module.css";
import {
  TEACHER_QUICK_TEMPLATES,
  TEACHER_POINT_SNIPPETS,
  getRecentPhrases,
  pushRecentPhrase,
  buildTeacherHomeworkHref,
  localTodayYmd,
} from "../../../lib/lessonNotes/teacherQuickCompose";
import { buildHomeworkPrefillFromNoteForm, HW_PREFILL_FROM_NOTE_KEY } from "../../../lib/homework/quickHomework";
import { completeOpsFlowStep, opsFlowDoneFallback } from "../../../lib/ops/opsFlowQueue";
import {
  recordTeacherNoteQuickTemplateUse,
  recordTeacherPointSnippetUse,
  sortNoteQuickTemplateIdsByUsage,
  sortPointSnippetIdsByUsage,
} from "../../../lib/teacher/teacherUiUsage";

const EMPTY_FORM = {
  id: "",
  lessonUnitId: "",
  date: "",
  title: "",
  summary: "",
  content: "",
  homeworkSummary: "",
  nextLessonPlan: "",
  studentIds: "",
  isSharedToStudents: true,
};

function formatDate(value) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ja-JP");
}

function buildBulkAssignResultStorageKey(apiBasePath) {
  return `lesson-notes:bulk-assign-result:${String(apiBasePath || "").trim() || "default"}`;
}

const BULK_ASSIGN_RESULT_TTL_MINUTES = Math.max(
  1,
  Number(process.env.NEXT_PUBLIC_LESSON_NOTE_BULK_RESULT_TTL_MINUTES || 30)
);
const BULK_ASSIGN_RESULT_TTL_MS = BULK_ASSIGN_RESULT_TTL_MINUTES * 60 * 1000;

export default function AdminLessonNotesPanel({
  apiBasePath = "/api/admin/lesson-notes",
  createSuccessText = "レッスンノートを作成しました。",
  updateSuccessText = "レッスンノートを更新しました。",
  scopeNotice = "",
  showOwnerBadge = false,
  ownerBadgeText = "作成者: 自分",
  enableUnassignedTeacherFilter = false,
  enableBulkAssignUnassignedTeacher = false,
  initialStudentIdFilter = "",
  initialLessonUnitId = "",
  initialNoteDate = "",
}) {
  const [notes, setNotes] = useState([]);
  const [teacherUsers, setTeacherUsers] = useState([]);
  const [selectedTeacherUserId, setSelectedTeacherUserId] = useState("");
  const [bulkAssignScope, setBulkAssignScope] = useState("all");
  const [bulkAssignLessonUnitId, setBulkAssignLessonUnitId] = useState("");
  const [bulkAssignPreviewCount, setBulkAssignPreviewCount] = useState(0);
  const [bulkAssignPreviewLoading, setBulkAssignPreviewLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [unassignedTeacherOnly, setUnassignedTeacherOnly] = useState(false);
  const [studentIdFilter, setStudentIdFilter] = useState(String(initialStudentIdFilter || "").trim());
  const [status, setStatus] = useState({ type: "", text: "" });
  const [bulkAssignResult, setBulkAssignResult] = useState(null);
  const [postSaveHomeworkLink, setPostSaveHomeworkLink] = useState("");
  const [recentPhraseTick, setRecentPhraseTick] = useState(0);
  const [recentInsertTarget, setRecentInsertTarget] = useState("summary");
  const [pointInsertTarget, setPointInsertTarget] = useState("summary");
  const [openHomeworkAfterSave, setOpenHomeworkAfterSave] = useState(true);
  const [usageSortTick, setUsageSortTick] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEdit = Boolean(form.id);

  const showQuickCompose = String(apiBasePath || "").includes("/teacher/");
  const recentPhrases = useMemo(() => {
    if (!showQuickCompose) return [];
    return getRecentPhrases();
  }, [showQuickCompose, recentPhraseTick]);

  const orderedQuickTemplates = useMemo(() => {
    if (!showQuickCompose) return TEACHER_QUICK_TEMPLATES;
    const ids = sortNoteQuickTemplateIdsByUsage(TEACHER_QUICK_TEMPLATES);
    const map = new Map(TEACHER_QUICK_TEMPLATES.map((t) => [t.id, t]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [showQuickCompose, usageSortTick]);

  const orderedPointSnippets = useMemo(() => {
    if (!showQuickCompose) return TEACHER_POINT_SNIPPETS;
    const ids = sortPointSnippetIdsByUsage(TEACHER_POINT_SNIPPETS);
    const map = new Map(TEACHER_POINT_SNIPPETS.map((t) => [t.id, t]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, [showQuickCompose, usageSortTick]);

  const bumpUsageSort = useCallback(() => setUsageSortTick((n) => n + 1), []);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => String(b.date || b.updatedAt || "").localeCompare(String(a.date || a.updatedAt || ""))),
    [notes]
  );

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (enableUnassignedTeacherFilter && unassignedTeacherOnly) params.set("unassignedTeacherOnly", "1");
      if (studentIdFilter) params.set("studentId", studentIdFilter);
      const query = params.toString();
      const response = await fetch(`${apiBasePath}${query ? `?${query}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "レッスンノート取得に失敗しました。");
      setNotes(data.notes || []);
    } catch (error) {
      setStatus({ type: "error", text: error.message || "読み込み中にエラーが発生しました。" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBasePath, enableUnassignedTeacherFilter, unassignedTeacherOnly, studentIdFilter]);

  useEffect(() => {
    if (!enableBulkAssignUnassignedTeacher) return;
    let active = true;
    async function loadTeachers() {
      try {
        const response = await fetch("/api/admin/teacher-users", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || "先生一覧取得に失敗しました。");
        if (!active) return;
        const rows = data.teachers || [];
        setTeacherUsers(rows);
        if (!selectedTeacherUserId && rows[0]?.id) {
          setSelectedTeacherUserId(rows[0].id);
        }
      } catch (error) {
        if (!active) return;
        setStatus({ type: "error", text: error.message || "先生一覧の読み込みに失敗しました。" });
      }
    }
    loadTeachers();
    return () => {
      active = false;
    };
  }, [enableBulkAssignUnassignedTeacher, selectedTeacherUserId]);

  useEffect(() => {
    if (!enableBulkAssignUnassignedTeacher) return;
    try {
      const storageKey = buildBulkAssignResultStorageKey(apiBasePath);
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const appliedAtMs = new Date(parsed.appliedAt || "").getTime();
      if (!Number.isFinite(appliedAtMs) || Date.now() - appliedAtMs > BULK_ASSIGN_RESULT_TTL_MS) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      setBulkAssignResult({
        updatedCount: Number(parsed.updatedCount || 0),
        updatedNoteIdsPreview: Array.isArray(parsed.updatedNoteIdsPreview) ? parsed.updatedNoteIdsPreview : [],
        hasMoreUpdatedNoteIds: Boolean(parsed.hasMoreUpdatedNoteIds),
        teacherDisplayName: String(parsed.teacherDisplayName || ""),
        appliedAt: String(parsed.appliedAt || ""),
      });
    } catch {
      // Ignore parsing/storage errors for non-critical UI cache.
    }
  }, [enableBulkAssignUnassignedTeacher, apiBasePath]);

  useEffect(() => {
    if (!enableBulkAssignUnassignedTeacher) return;
    try {
      const storageKey = buildBulkAssignResultStorageKey(apiBasePath);
      if (!bulkAssignResult) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      window.sessionStorage.setItem(storageKey, JSON.stringify(bulkAssignResult));
    } catch {
      // Ignore storage quota/permission issues.
    }
  }, [enableBulkAssignUnassignedTeacher, apiBasePath, bulkAssignResult]);

  useEffect(() => {
    if (!enableBulkAssignUnassignedTeacher) return;
    if (!bulkAssignResult?.appliedAt) return;
    const appliedAtMs = new Date(bulkAssignResult.appliedAt).getTime();
    if (!Number.isFinite(appliedAtMs)) return;
    const remainingMs = BULK_ASSIGN_RESULT_TTL_MS - (Date.now() - appliedAtMs);
    if (remainingMs <= 0) {
      setBulkAssignResult(null);
      return;
    }
    const timerId = window.setTimeout(() => {
      setBulkAssignResult(null);
    }, remainingMs);
    return () => window.clearTimeout(timerId);
  }, [enableBulkAssignUnassignedTeacher, bulkAssignResult]);

  useEffect(() => {
    if (!enableBulkAssignUnassignedTeacher) return;
    let active = true;
    async function loadPreviewCount() {
      const scopedLessonUnitId = bulkAssignScope === "lesson_unit" ? String(bulkAssignLessonUnitId || "").trim() : "";
      if (bulkAssignScope === "lesson_unit" && !scopedLessonUnitId) {
        setBulkAssignPreviewCount(0);
        setBulkAssignPreviewLoading(false);
        return;
      }

      setBulkAssignPreviewLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("unassignedTeacherOnly", "1");
        if (scopedLessonUnitId) params.set("lessonUnitId", scopedLessonUnitId);
        if (studentIdFilter) params.set("studentId", studentIdFilter);
        const response = await fetch(`/api/admin/lesson-notes?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || "件数取得に失敗しました。");
        if (!active) return;
        setBulkAssignPreviewCount(Array.isArray(data?.notes) ? data.notes.length : 0);
      } catch (error) {
        if (!active) return;
        setBulkAssignPreviewCount(0);
        setStatus({ type: "error", text: error.message || "件数取得中にエラーが発生しました。" });
      } finally {
        if (active) setBulkAssignPreviewLoading(false);
      }
    }
    loadPreviewCount();
    return () => {
      active = false;
    };
  }, [enableBulkAssignUnassignedTeacher, bulkAssignScope, bulkAssignLessonUnitId, studentIdFilter]);

  useEffect(() => {
    if (!studentIdFilter) return;
    if (isEdit) return;
    setForm((prev) => {
      if (String(prev.studentIds || "").trim()) return prev;
      return { ...prev, studentIds: studentIdFilter };
    });
  }, [studentIdFilter, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    const lid = String(initialLessonUnitId || "").trim();
    const nd = String(initialNoteDate || "").trim().slice(0, 10);
    setForm((prev) => {
      let next = { ...prev };
      if (lid && !String(prev.lessonUnitId || "").trim()) {
        next.lessonUnitId = lid;
      }
      if (!String(prev.date || "").trim()) {
        if (nd) next.date = nd;
        else if (showQuickCompose) next.date = localTodayYmd();
      }
      return next;
    });
  }, [initialLessonUnitId, initialNoteDate, isEdit, showQuickCompose]);

  function resetForm() {
    if (showQuickCompose) {
      setForm({ ...EMPTY_FORM, date: localTodayYmd() });
    } else {
      setForm(EMPTY_FORM);
    }
  }

  function applyQuickTemplate(templateId) {
    const t = TEACHER_QUICK_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    const hasContent = [form.title, form.summary, form.content, form.homeworkSummary, form.nextLessonPlan].some((s) =>
      String(s || "").trim()
    );
    if (hasContent && !window.confirm("入力内容を定型で上書きしますか？")) return;
    recordTeacherNoteQuickTemplateUse(templateId);
    bumpUsageSort();
    setForm((prev) => ({ ...prev, ...t.patch }));
  }

  function appendRecentToField(field, phrase) {
    const add = String(phrase || "").trim();
    if (!add) return;
    const key = field === "content" ? "content" : "summary";
    setForm((prev) => {
      const p = String(prev[key] || "");
      const sep = p && !p.endsWith("\n") ? "\n" : "";
      return { ...prev, [key]: p ? `${p}${sep}${add}` : add };
    });
  }

  function appendPointSnippet(snippetId) {
    const s = TEACHER_POINT_SNIPPETS.find((x) => x.id === snippetId);
    if (!s) return;
    recordTeacherPointSnippetUse(snippetId);
    bumpUsageSort();
    const line =
      pointInsertTarget === "nextLessonPlan" ? String(s.nextLine || "").trim() : String(s.summaryLine || "").trim();
    if (!line) return;
    const key = pointInsertTarget === "nextLessonPlan" ? "nextLessonPlan" : "summary";
    setForm((prev) => {
      const p = String(prev[key] || "");
      const sep = p && !p.endsWith("\n") ? "\n" : "";
      return { ...prev, [key]: p ? `${p}${sep}${line}` : line };
    });
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const safeTitle = String(form.title || "").trim() || "レッスンノート";
      let safeDate = String(form.date || "").trim().slice(0, 10);
      if (!safeDate && showQuickCompose) {
        safeDate = localTodayYmd();
      }
      const url = isEdit ? `${apiBasePath}/${form.id}` : apiBasePath;
      const method = isEdit ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonUnitId: form.lessonUnitId,
          date: safeDate || form.date,
          title: safeTitle,
          summary: form.summary,
          content: form.content,
          homeworkSummary: form.homeworkSummary,
          nextLessonPlan: form.nextLessonPlan,
          studentIds: form.studentIds,
          isSharedToStudents: form.isSharedToStudents,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "保存に失敗しました。");
      setStatus({ type: "ok", text: isEdit ? updateSuccessText : createSuccessText });
      const isTeacherPath = String(apiBasePath || "").includes("/teacher/");
      const shouldChainHomework = isTeacherPath && !isEdit;
      const snapshot = shouldChainHomework
        ? {
            lessonUnitId: form.lessonUnitId,
            studentIds: form.studentIds,
            date: safeDate || form.date,
          }
        : null;
      const summaryLine = String(form.summary || "").trim();
      if (shouldChainHomework && summaryLine) {
        pushRecentPhrase(summaryLine);
        setRecentPhraseTick((n) => n + 1);
      }
      const homeworkHref = snapshot ? buildTeacherHomeworkHref(snapshot) : "";
      const shouldRedirectToHomework = Boolean(snapshot && openHomeworkAfterSave && !isEdit && homeworkHref);
      const formForPrefill = { ...form, title: safeTitle, date: safeDate || form.date };
      const hwPrefillPayload = shouldChainHomework && snapshot ? buildHomeworkPrefillFromNoteForm(formForPrefill) : null;
      if (hwPrefillPayload?.studentId) {
        try {
          window.sessionStorage.setItem(HW_PREFILL_FROM_NOTE_KEY, JSON.stringify(hwPrefillPayload));
        } catch {
          // ignore
        }
      }

      const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      const flow = completeOpsFlowStep(pathname, searchStr);

      resetForm();
      if (shouldRedirectToHomework) {
        setPostSaveHomeworkLink("");
        router.push(homeworkHref);
        return;
      }
      if (flow.done && flow.matched) {
        setPostSaveHomeworkLink("");
        router.push(opsFlowDoneFallback(flow.role));
        return;
      }
      if (flow.next) {
        setPostSaveHomeworkLink("");
        router.push(flow.next);
        return;
      }
      if (snapshot) {
        setPostSaveHomeworkLink(homeworkHref);
      } else {
        setPostSaveHomeworkLink("");
      }
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存中にエラーが発生しました。" });
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(id) {
    if (!window.confirm("このレッスンノートを削除しますか？")) return;
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch(`${apiBasePath}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "削除に失敗しました。");
      setStatus({ type: "ok", text: "レッスンノートを削除しました。" });
      if (form.id === id) resetForm();
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "削除中にエラーが発生しました。" });
    }
  }

  async function bulkAssignTeacher() {
    if (!selectedTeacherUserId) {
      setStatus({ type: "error", text: "担当先生を選択してください。" });
      return;
    }
    const scopedLessonUnitId = bulkAssignScope === "lesson_unit" ? String(bulkAssignLessonUnitId || "").trim() : "";
    if (bulkAssignScope === "lesson_unit" && !scopedLessonUnitId) {
      setStatus({ type: "error", text: "lessonUnitId を入力してください。" });
      return;
    }
    if (bulkAssignPreviewCount <= 0) {
      setStatus({ type: "error", text: "현재 범위에 작成者未設定ノートがありません。" });
      return;
    }
    const confirmMessage =
      bulkAssignScope === "lesson_unit"
        ? `lessonUnitId=${scopedLessonUnitId} の未設定ノートに担当先生を一括設定しますか？`
        : "全未設定レッスンノートに担当先生を一括設定しますか？";
    if (!window.confirm(confirmMessage)) return;
    setBulkAssigning(true);
    setStatus({ type: "", text: "" });
    setBulkAssignResult(null);
    try {
      const response = await fetch("/api/admin/lesson-notes/assign-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherUserId: selectedTeacherUserId,
          lessonUnitId: scopedLessonUnitId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "一括設定に失敗しました。");
      setStatus({
        type: "ok",
        text:
          bulkAssignScope === "lesson_unit"
            ? `lessonUnitId=${scopedLessonUnitId} で ${data?.updatedCount || 0}件の担当先生を設定しました。`
            : `${data?.updatedCount || 0}件のレッスンノートに担当先生を設定しました。`,
      });
      setBulkAssignResult({
        updatedCount: Number(data?.updatedCount || 0),
        updatedNoteIdsPreview: Array.isArray(data?.updatedNoteIdsPreview) ? data.updatedNoteIdsPreview : [],
        hasMoreUpdatedNoteIds: Boolean(data?.hasMoreUpdatedNoteIds),
        teacherDisplayName: String(data?.teacher?.displayName || ""),
        appliedAt: new Date().toISOString(),
      });
      setUnassignedTeacherOnly(true);
      await load();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "一括設定中にエラーが発生しました。" });
    } finally {
      setBulkAssigning(false);
    }
  }

  return (
    <>
      {scopeNotice ? <p className={styles.description}>{scopeNotice}</p> : null}
      <label className={styles.label}>
        学生IDフィルター (任意)
        <input
          className={styles.field}
          value={studentIdFilter}
          onChange={(e) => setStudentIdFilter(e.target.value)}
          placeholder="studentId"
        />
      </label>
      {enableUnassignedTeacherFilter ? (
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={unassignedTeacherOnly}
            onChange={(e) => setUnassignedTeacherOnly(e.target.checked)}
          />
          作成者未設定ノートのみ表示
        </label>
      ) : null}
      {enableBulkAssignUnassignedTeacher ? (
        <>
          <label className={styles.label}>
            一括設定範囲
            <select
              className={styles.field}
              value={bulkAssignScope}
              onChange={(e) => setBulkAssignScope(e.target.value)}
            >
              <option value="all">全未設定ノート</option>
              <option value="lesson_unit">特定 lessonUnitId</option>
            </select>
          </label>
          {bulkAssignScope === "lesson_unit" ? (
            <label className={styles.label}>
              範囲 lessonUnitId
              <input
                className={styles.field}
                value={bulkAssignLessonUnitId}
                onChange={(e) => setBulkAssignLessonUnitId(e.target.value)}
                placeholder="lessonUnitId を入力"
              />
            </label>
          ) : null}
          <label className={styles.label}>
            一括設定する担当先生
            <select
              className={styles.field}
              value={selectedTeacherUserId}
              onChange={(e) => setSelectedTeacherUserId(e.target.value)}
            >
              <option value="">先生を選択してください</option>
              {teacherUsers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.displayName} ({teacher.email})
                </option>
              ))}
            </select>
          </label>
          <div className={styles.links}>
            <button
              className={styles.button}
              type="button"
              onClick={bulkAssignTeacher}
              disabled={bulkAssigning || bulkAssignPreviewLoading || bulkAssignPreviewCount <= 0}
            >
              {bulkAssigning ? "一括設定中..." : "未設定ノートに担当先生を一括設定"}
            </button>
            <a className={styles.link} href="/admin?auditAction=lesson_note.teacher_assigned_bulk">
              適用履歴を見る
            </a>
          </div>
          <p className={styles.description}>
            {bulkAssignPreviewLoading
              ? "対象件数を確認中..."
              : bulkAssignScope === "lesson_unit"
                ? `現在の対象件数: ${bulkAssignPreviewCount}件 (lessonUnitId=${String(bulkAssignLessonUnitId || "").trim() || "-"})`
                : `現在の対象件数: ${bulkAssignPreviewCount}件 (全体 / 作成者未設定ノート)`}
          </p>
          <p className={styles.description}>
            結果表示は{BULK_ASSIGN_RESULT_TTL_MINUTES}分後に自動でクリアされます。
          </p>
          {bulkAssignResult?.updatedCount > 0 ? (
            <>
              <p className={styles.description}>
                担当先生: {bulkAssignResult.teacherDisplayName || "-"}
                <br />
                適用時刻: {formatDateTime(bulkAssignResult.appliedAt)}
                <br />
                更新ノートID:{" "}
                {bulkAssignResult.updatedNoteIdsPreview.length > 0
                  ? bulkAssignResult.updatedNoteIdsPreview.join(", ")
                  : "-"}
                {bulkAssignResult.hasMoreUpdatedNoteIds ? " ..." : ""}
              </p>
              <div className={styles.links}>
                <button className={styles.button} type="button" onClick={() => setBulkAssignResult(null)}>
                  結果表示をクリア
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
      <form onSubmit={submitForm}>
        {showQuickCompose ? (
          <div
            style={{
              marginBottom: "0.85rem",
              padding: "0.65rem 0.75rem",
              borderRadius: "12px",
              border: "1px solid rgba(148, 163, 184, 0.45)",
              background: "rgba(248, 250, 252, 0.95)",
            }}
          >
            <p className={styles.description} style={{ marginTop: 0, marginBottom: "0.45rem" }}>
              定型テンプレートと直近の文で、入力を短くできます。
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.45rem" }}>
              {orderedQuickTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  className={styles.button}
                  type="button"
                  onClick={() => applyQuickTemplate(tpl.id)}
                  style={{ fontSize: "0.82rem", padding: "0.28rem 0.55rem" }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
            <p className={styles.description} style={{ margin: "0.35rem 0 0.25rem" }}>
              学習ポイント（ワンタップ）
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "0.35rem",
                marginBottom: "0.35rem",
              }}
            >
              <span className={styles.description} style={{ margin: 0 }}>
                反映先
              </span>
              <button
                className={styles.button}
                type="button"
                onClick={() => setPointInsertTarget("summary")}
                style={{
                  fontSize: "0.78rem",
                  padding: "0.22rem 0.5rem",
                  opacity: pointInsertTarget === "summary" ? 1 : 0.65,
                }}
              >
                要約
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => setPointInsertTarget("nextLessonPlan")}
                style={{
                  fontSize: "0.78rem",
                  padding: "0.22rem 0.5rem",
                  opacity: pointInsertTarget === "nextLessonPlan" ? 1 : 0.65,
                }}
              >
                次回計画
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.45rem" }}>
              {orderedPointSnippets.map((sn) => (
                <button
                  key={sn.id}
                  className={styles.button}
                  type="button"
                  onClick={() => appendPointSnippet(sn.id)}
                  style={{ fontSize: "0.78rem", padding: "0.24rem 0.5rem" }}
                >
                  {sn.label}
                </button>
              ))}
            </div>
            {recentPhrases.length > 0 ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "0.35rem",
                    margin: "0.25rem 0 0.35rem",
                  }}
                >
                  <span className={styles.description} style={{ margin: 0 }}>
                    挿入先
                  </span>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() => setRecentInsertTarget("summary")}
                    style={{
                      fontSize: "0.78rem",
                      padding: "0.22rem 0.5rem",
                      opacity: recentInsertTarget === "summary" ? 1 : 0.65,
                    }}
                  >
                    要約
                  </button>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() => setRecentInsertTarget("content")}
                    style={{
                      fontSize: "0.78rem",
                      padding: "0.22rem 0.5rem",
                      opacity: recentInsertTarget === "content" ? 1 : 0.65,
                    }}
                  >
                    本文
                  </button>
                </div>
                <p className={styles.description} style={{ margin: "0 0 0.35rem" }}>
                  直近の文を挿入
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {recentPhrases.map((phrase) => (
                    <button
                      key={phrase}
                      className={styles.button}
                      type="button"
                      onClick={() => appendRecentToField(recentInsertTarget, phrase)}
                      style={{ fontSize: "0.78rem", padding: "0.22rem 0.5rem", maxWidth: "100%" }}
                      title={phrase}
                    >
                      {phrase.length > 42 ? `${phrase.slice(0, 42)}…` : phrase}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <label className={styles.label}>
          lessonUnitId
          <input
            className={styles.field}
            value={form.lessonUnitId}
            onChange={(e) => setForm((prev) => ({ ...prev, lessonUnitId: e.target.value }))}
            required
          />
        </label>
        <label className={styles.label}>
          日付
          <input
            className={styles.field}
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          />
        </label>
        <label className={styles.label}>
          タイトル
          <input
            className={styles.field}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
        </label>
        <label className={styles.label}>
          要約
          {showQuickCompose ? (
            <textarea
              className={styles.field}
              rows={3}
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="本日の要点（短く）"
            />
          ) : (
            <input
              className={styles.field}
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            />
          )}
        </label>
        <label className={styles.label}>
          本文
          <textarea
            className={styles.field}
            rows={5}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          />
        </label>
        <label className={styles.label}>
          宿題要約
          {showQuickCompose ? (
            <textarea
              className={styles.field}
              rows={2}
              value={form.homeworkSummary}
              onChange={(e) => setForm((prev) => ({ ...prev, homeworkSummary: e.target.value }))}
              placeholder="宿題の内容"
            />
          ) : (
            <input
              className={styles.field}
              value={form.homeworkSummary}
              onChange={(e) => setForm((prev) => ({ ...prev, homeworkSummary: e.target.value }))}
            />
          )}
        </label>
        <label className={styles.label}>
          次回計画
          {showQuickCompose ? (
            <textarea
              className={styles.field}
              rows={2}
              value={form.nextLessonPlan}
              onChange={(e) => setForm((prev) => ({ ...prev, nextLessonPlan: e.target.value }))}
              placeholder="次回の予定"
            />
          ) : (
            <input
              className={styles.field}
              value={form.nextLessonPlan}
              onChange={(e) => setForm((prev) => ({ ...prev, nextLessonPlan: e.target.value }))}
            />
          )}
        </label>
        <label className={styles.label}>
          対象学生ID (カンマ区切り, 任意)
          <input
            className={styles.field}
            value={form.studentIds}
            onChange={(e) => setForm((prev) => ({ ...prev, studentIds: e.target.value }))}
            placeholder="student-id-1,student-id-2"
          />
        </label>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={form.isSharedToStudents}
            onChange={(e) => setForm((prev) => ({ ...prev, isSharedToStudents: e.target.checked }))}
          />
          学生/保護者に公開
        </label>
        {showQuickCompose && !isEdit ? (
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={openHomeworkAfterSave}
              onChange={(e) => setOpenHomeworkAfterSave(e.target.checked)}
            />
            保存後に宿題画面へ進む（推奨）
          </label>
        ) : null}
        <div className={styles.links}>
          <button className={styles.button} type="submit" disabled={saving}>
            {saving ? "保存中..." : isEdit ? "レッスンノート更新" : "レッスンノート作成"}
          </button>
          {isEdit ? (
            <button
              className={styles.button}
              type="button"
              onClick={() => {
                resetForm();
                setPostSaveHomeworkLink("");
              }}
            >
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

      {postSaveHomeworkLink ? (
        <div
          className={styles.links}
          style={{
            marginTop: "0.5rem",
            padding: "0.65rem 0.75rem",
            borderRadius: "12px",
            border: "1px solid rgba(59, 130, 246, 0.35)",
            background: "rgba(239, 246, 255, 0.9)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className={styles.description} style={{ margin: 0, width: "100%" }}>
            保存しました。続けて宿題を登録できます。
          </span>
          <Link className={styles.button} href={postSaveHomeworkLink} style={{ textDecoration: "none" }}>
            宿題画面へ進む
          </Link>
          <button className={styles.button} type="button" onClick={() => setPostSaveHomeworkLink("")}>
            閉じる
          </button>
        </div>
      ) : null}

      <h2 className={styles.sectionTitle}>レッスンノート一覧</h2>
      {loading ? <p className={styles.description}>読み込み中...</p> : null}
      <div className={styles.links}>
        {sortedNotes.map((note) => (
          <article key={note.id} className={styles.infoCard}>
            <p>
              <strong>{note.title || "レッスンノート"}</strong>
            </p>
            <p>lessonUnitId: {note.lessonUnitId || "-"}</p>
            <p>日付: {formatDate(note.date || note.updatedAt)}</p>
            <p>担当講師: {note.teacherName || note.teacherUserId || "-"}</p>
            <p>対象学生数: {note.studentCount || 0}名</p>
            <p>公開: {note.isSharedToStudents ? "公開" : "非公開"}</p>
            <p>宿題: {note.homeworkSummary ? "設定済み" : "未設定"}</p>
            {showOwnerBadge ? <p>{ownerBadgeText}</p> : null}
            <p>{note.summary || "-"}</p>
            <div className={styles.links}>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  setForm({
                    id: note.id,
                    lessonUnitId: note.lessonUnitId || "",
                    date: formatDate(note.date || ""),
                    title: note.title || "",
                    summary: note.summary || "",
                    content: note.content || "",
                    homeworkSummary: note.homeworkSummary || "",
                    nextLessonPlan: note.nextLessonPlan || "",
                    studentIds: (note.students || []).map((student) => student.id).join(","),
                    isSharedToStudents: note.isSharedToStudents !== false,
                  })
                }
              >
                修正
              </button>
              <button className={styles.button} type="button" onClick={() => removeNote(note.id)}>
                削除
              </button>
              <Link
                className={styles.link}
                href={`${
                  String(apiBasePath).includes("/teacher/") ? "/teacher/homework" : "/admin/homework"
                }?lessonUnitId=${encodeURIComponent(note.lessonUnitId || "")}&studentId=${encodeURIComponent(
                  note.students?.[0]?.id || ""
                )}&lessonDate=${encodeURIComponent(formatDate(note.date || ""))}`}
              >
                宿題を管理
              </Link>
            </div>
          </article>
        ))}
        {!loading && sortedNotes.length === 0 ? <p>レッスンノートはまだありません。</p> : null}
      </div>
    </>
  );
}

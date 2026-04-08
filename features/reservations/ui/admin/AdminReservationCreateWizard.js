"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminLessonTypes,
  fetchAdminStudentById,
  postAdminReservationCandidates,
  postAdminReservationCreate,
} from "../../adapters/adminReservationsAdapter";
import StudentSearchField from "./StudentSearchField";
import wz from "./admin-reservation-wizard.module.css";

const LS_RECENT = "malmoi.admin.reservationRecentStudents";
const LS_PINNED = "malmoi.admin.reservationPinnedStudents";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

function pushRecent(studentId) {
  const cur = readJson(LS_RECENT, []);
  const next = [studentId, ...cur.filter((id) => id !== studentId)].slice(0, 24);
  writeJson(LS_RECENT, next);
}

function formatPt(n) {
  const v = Math.max(0, Number(n || 0));
  return `${v.toLocaleString("ja-JP")}pt`;
}

function normalizeStudentFromApi(raw) {
  if (!raw || !raw.id) return null;
  return {
    id: raw.id,
    nameKanji: raw.nameKanji || raw.displayNameJa || "—",
    nameFurigana: raw.nameFurigana || "",
    studentNumber: raw.studentNumber || "",
    lessonMinutes: raw.lessonMinutes,
    currentPoints: raw.currentPoints ?? raw.points?.balance ?? 0,
    points: raw.points,
  };
}

export default function AdminReservationCreateWizard({
  open,
  onClose,
  fromDate,
  teachers = [],
  studentsById = {},
  onCreated,
  prefillStudentId = "",
}) {
  const [step, setStep] = useState(1);
  const [student, setStudent] = useState(null);
  const [lessonTypes, setLessonTypes] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [instructorId, setInstructorId] = useState("");
  const [delivery, setDelivery] = useState("in_person");
  const [candidates, setCandidates] = useState([]);
  const [studentSnapshot, setStudentSnapshot] = useState(null);
  const [slotId, setSlotId] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [recentIdsState, setRecentIdsState] = useState([]);
  const [extraStudents, setExtraStudents] = useState({});

  const studentsByIdMerged = useMemo(
    () => ({ ...studentsById, ...extraStudents }),
    [studentsById, extraStudents]
  );

  const filteredTeachers = useMemo(() => {
    const ids = lesson?.teacherUserIds || [];
    if (!ids.length) return teachers;
    return teachers.filter((t) => ids.includes(t.id));
  }, [teachers, lesson]);

  const recentList = useMemo(
    () => recentIdsState.map((id) => studentsByIdMerged[id]).filter(Boolean),
    [recentIdsState, studentsByIdMerged]
  );

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setPinnedIds(readJson(LS_PINNED, []));
    setRecentIdsState(readJson(LS_RECENT, []));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setStudent(null);
      setLesson(null);
      setLessonTypes([]);
      setInstructorId("");
      setDelivery("in_person");
      setCandidates([]);
      setStudentSnapshot(null);
      setSlotId("");
      setMemo("");
      setError("");
      setDone(false);
    }
  }, [open]);

  useEffect(() => {
    const sid = String(prefillStudentId || "").trim();
    if (!open || !sid) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminStudentById(sid);
        const norm = normalizeStudentFromApi(data.student);
        if (!cancelled && norm) {
          setStudent(norm);
          setExtraStudents((prev) => ({ ...prev, [norm.id]: norm }));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "学生の読み込みに失敗しました。");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, prefillStudentId]);

  useEffect(() => {
    if (!open || step !== 2) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminLessonTypes();
        if (!cancelled) setLessonTypes(data.lessonTypes || []);
      } catch {
        if (!cancelled) setLessonTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step]);

  const loadCandidates = useCallback(async () => {
    if (!fromDate || !lesson?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await postAdminReservationCandidates({
        studentId: student?.id || "",
        lessonTypeId: lesson.id,
        teacherId: instructorId,
        targetDate: fromDate,
        lessonMode: delivery,
      });
      setCandidates(data.candidates || []);
      setStudentSnapshot(data.studentSnapshot || null);
    } catch (e) {
      setError(e.message || "読み込みエラー");
      setCandidates([]);
      setStudentSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [fromDate, lesson, student, instructorId, delivery]);

  useEffect(() => {
    if (!open || step !== 4) return;
    loadCandidates();
  }, [open, step, loadCandidates]);

  function togglePin(id) {
    const sid = String(id);
    setPinnedIds((prev) => {
      const next = prev.includes(sid) ? prev.filter((x) => x !== sid) : [sid, ...prev].slice(0, 30);
      writeJson(LS_PINNED, next);
      return next;
    });
  }

  const mergedRecent = useMemo(() => {
    const pinSet = new Set(pinnedIds);
    const byId = new Map();
    pinnedIds.forEach((id) => {
      if (studentsByIdMerged[id]) byId.set(id, studentsByIdMerged[id]);
    });
    recentList.forEach((s) => {
      if (!byId.has(s.id)) byId.set(s.id, s);
    });
    return [...byId.values()].sort((a, b) => {
      const ap = pinSet.has(String(a.id)) ? 0 : 1;
      const bp = pinSet.has(String(b.id)) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return (a.nameKanji || "").localeCompare(b.nameKanji || "");
    });
  }, [pinnedIds, recentList, studentsByIdMerged]);

  const selectedCandidate = candidates.find((c) => c.slotId === slotId);
  const rem =
    studentSnapshot?.remainingMinutes ??
    Math.max(0, Number(student?.lessonMinutes?.remainingMinutes ?? 0));
  const pts =
    studentSnapshot?.currentPoints ?? Math.max(0, Number(student?.currentPoints ?? student?.points?.balance ?? 0));
  const dur = Number(lesson?.durationMinutes || selectedCandidate?.durationMinutes || 0);
  const pointLine = selectedCandidate?.pointCost ?? lesson?.pointCost;

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await postAdminReservationCreate({
        mode: "single",
        slotId,
        studentId: student.id,
        lessonDeliveryType: delivery,
        lessonServiceId: lesson.id,
        memo,
      });
      pushRecent(student.id);
      setRecentIdsState(readJson(LS_RECENT, []));
      setDone(true);
      setStep(6);
      if (typeof onCreated === "function") onCreated();
    } catch (e) {
      setError(e.message || "保存エラー");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className={wz.overlay} role="dialog" aria-modal="true" aria-label="予約作成ウィザード">
      <div className={wz.card}>
        <h3 className={wz.title}>予約作成（運用ウィザード）</h3>
        <div className={wz.steps}>
          {["学生", "レッスン", "講師・形式", "候補", "確認", "完了"].map((lab, i) => (
            <span key={lab} className={wz.stepPill} data-on={step === i + 1 ? "1" : "0"}>
              {i + 1}. {lab}
            </span>
          ))}
        </div>

        {error ? <p className={wz.err}>{error}</p> : null}

        {step === 1 ? (
          <>
            <StudentSearchField
              selected={student}
              onSelect={(s) => {
                setStudent(s);
                setExtraStudents((prev) => ({ ...prev, [s.id]: s }));
              }}
              recentList={mergedRecent}
              pinnedIds={pinnedIds}
              onTogglePin={togglePin}
            />
            {student ? (
              <div className={wz.confirmBox} style={{ marginTop: "0.65rem" }}>
                <strong>{student.nameKanji}</strong>
                {student.nameFurigana ? <div className={wz.muted}>{student.nameFurigana}</div> : null}
                <div>学生番号 {student.studentNumber || "—"}</div>
                <div>残り時間 {rem} 分</div>
                <div>保有ポイント {formatPt(student.currentPoints ?? student.points?.balance)}</div>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <div className={wz.lessonGrid}>
            {lessonTypes.length === 0 ? (
              <p className={wz.muted}>レッスン・サービスが未設定です。設定 → レッスン・サービスから登録してください。</p>
            ) : null}
            {lessonTypes.map((svc) => (
              <button
                key={svc.id}
                type="button"
                className={wz.lessonCard}
                data-on={lesson?.id === svc.id ? "1" : "0"}
                onClick={() => {
                  setLesson({
                    id: svc.id,
                    displayNameJa: svc.displayName,
                    durationMinutes: svc.durationMinutes,
                    consumePoints: svc.pointCost,
                    teacherUserIds: svc.teacherUserIds || [],
                  });
                }}
              >
                <div className={wz.lessonName}>{svc.displayName || svc.id}</div>
                <div className={wz.lessonMeta}>
                  {svc.durationMinutes}分 / {formatPt(svc.pointCost)} / 形式 {svc.lessonMode || "—"}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className={wz.teacherRow}>
            <label className={wz.searchLabel}>講師（任意・絞り込み）</label>
            <button
              type="button"
              className={wz.teacherChip}
              data-on={instructorId === "" ? "1" : "0"}
              onClick={() => setInstructorId("")}
            >
              指定なし
            </button>
            {filteredTeachers.map((t) => (
              <button
                key={t.id}
                type="button"
                className={wz.teacherChip}
                data-on={instructorId === t.id ? "1" : "0"}
                onClick={() => setInstructorId(t.id)}
              >
                {t.displayName || t.email}
              </button>
            ))}
            <label className={wz.searchLabel}>レッスン形式</label>
            <select
              className={wz.searchInput}
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
            >
              <option value="in_person">対面</option>
              <option value="online">オンライン</option>
            </select>
          </div>
        ) : null}

        {step === 4 ? (
          <>
            <p className={wz.muted}>基準日 {fromDate} の候補（エンジン評価）</p>
            {loading ? <p className={wz.muted}>読み込み中…</p> : null}
            <div className={wz.candidateGrid}>
              {candidates.map((c) => {
                const ok = Boolean(c.bookingOk);
                const remMin = c.remainingMinutesAfterBooking;
                const remPt = c.remainingPointsAfterBooking;
                const reasonHint = [
                  ...(c.blockReasonsJa || []),
                  ...(c.warnReasonsJa || []),
                ]
                  .filter(Boolean)
                  .slice(0, 4)
                  .join(" · ");
                return (
                  <button
                    key={c.slotId}
                    type="button"
                    className={wz.candidateCard}
                    data-ok={ok ? "1" : "0"}
                    data-selected={slotId === c.slotId ? "1" : "0"}
                    title={!ok && reasonHint ? reasonHint : ok ? `${c.startTime}〜 選択` : undefined}
                    onClick={() => {
                      if (ok) setSlotId(c.slotId);
                    }}
                  >
                    <div className={wz.candidateTime}>
                      [{c.startTime} – {c.endTime}]
                    </div>
                    <div className={wz.candidateTeacher}>{c.teacherName || "講師"}</div>
                    <div className={wz.candidateMeta}>
                      {dur || c.durationMinutes ? `${c.durationMinutes || dur}分` : ""} {formatPt(c.pointCost)}
                    </div>
                    {remMin != null || remPt != null ? (
                      <div className={wz.candidateRemain}>
                        予約後 残り {remMin != null ? `${remMin}分` : "—"}
                        {remPt != null ? `（${formatPt(remPt)}）` : ""}
                      </div>
                    ) : null}
                    {!ok ? (
                      <ul className={wz.reasons}>
                        {(c.blockReasonsJa || []).slice(0, 3).map((r) => (
                          <li key={r}>× {r}</li>
                        ))}
                        {(c.warnReasonsJa || []).slice(0, 2).map((r) => (
                          <li key={r}>△ {r}</li>
                        ))}
                      </ul>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {!loading && candidates.length === 0 ? (
              <p className={wz.muted}>候補がありません。枠生成・設定を確認してください。</p>
            ) : null}
          </>
        ) : null}

        {step === 5 ? (
          <div className={wz.confirmBox}>
            <div>
              <strong>学生</strong> {student?.nameKanji}
            </div>
            <div>
              <strong>レッスン</strong> {lesson?.displayNameJa || lesson?.name}
            </div>
            <div>
              <strong>時間</strong> {fromDate} {selectedCandidate?.startTime}〜（{dur}分）
            </div>
            <div>
              <strong>消費ポイント</strong> {pointLine != null ? formatPt(pointLine) : "—"}
            </div>
            <div>
              <strong>形式</strong> {delivery === "online" ? "オンライン" : "対面"}
            </div>
            <div>
              <strong>講師</strong> {selectedCandidate?.teacherName || "—"}
            </div>
            <div>
              <strong>予約後の目安</strong> 残り {Math.max(0, rem - dur)} 分 / {formatPt(Math.max(0, pts - (pointLine || 0)))}
            </div>
            <label className={wz.searchLabel} style={{ marginTop: "0.5rem" }}>
              メモ
              <input className={wz.searchInput} value={memo} onChange={(e) => setMemo(e.target.value)} />
            </label>
          </div>
        ) : null}

        {step === 6 && done ? <div className={wz.success}>予約を保存しました。一覧を更新しました。</div> : null}

        <div className={wz.actions}>
          <button type="button" className={wz.btn} onClick={onClose}>
            閉じる
          </button>
          {step > 1 && step < 6 ? (
            <button type="button" className={wz.btn} onClick={() => setStep((s) => Math.max(1, s - 1))}>
              戻る
            </button>
          ) : null}
          {step === 1 ? (
            <button type="button" className={wz.btnPrimary} disabled={!student} onClick={() => setStep(2)}>
              次へ
            </button>
          ) : null}
          {step === 2 ? (
            <button type="button" className={wz.btnPrimary} disabled={!lesson} onClick={() => setStep(3)}>
              次へ
            </button>
          ) : null}
          {step === 3 ? (
            <button type="button" className={wz.btnPrimary} onClick={() => setStep(4)}>
              次へ
            </button>
          ) : null}
          {step === 4 ? (
            <button type="button" className={wz.btnPrimary} disabled={!slotId} onClick={() => setStep(5)}>
              次へ
            </button>
          ) : null}
          {step === 5 ? (
            <button type="button" className={wz.btnPrimary} disabled={loading} onClick={submit}>
              保存
            </button>
          ) : null}
          {step === 6 ? (
            <button type="button" className={wz.btnPrimary} onClick={onClose}>
              完了
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

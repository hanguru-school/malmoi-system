"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../../login/login.module.css";
import adminStyles from "../../admin.module.css";
import detailStyles from "./student-detail.module.css";
import RegistrationProgressPanel from "./RegistrationProgressPanel";
import StudentRecentFlowSummary from "./StudentRecentFlowSummary";
import StudentRiskStrip from "./StudentRiskStrip";
import {
  EMERGENCY_RELATION_PRESETS,
  emergencyRelationToStore,
  parseEmergencyRelation,
} from "../../../student/profile/profileFormUtils";
import { jpPaymentStatus, jpStudentPaymentCategory } from "../../../../lib/payments/receipt-labels.js";
import {
  buildLessonMinutesCompletionPreview,
  lessonMinuteJournalTypeLabelJa,
  lessonMinuteLedgerKindLabelJa,
} from "../../../../lib/adapters/lessonMinutesSummary.js";

const LESSON_MINUTE_QUICK_ADD_MINUTES = [600, 300, 180];

const TABS = [
  { id: "basic", label: "基本情報" },
  { id: "lesson-time", label: "レッスン時間" },
  { id: "reservations", label: "予約" },
  { id: "notes", label: "レッスンノート" },
  { id: "learning-stats", label: "学習統計" },
  { id: "payments", label: "決済・ルール" },
  { id: "parents", label: "保護者" },
  { id: "notices", label: "お知らせ履歴" },
  { id: "memo", label: "管理メモ" },
];

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP");
}

function reservationStatusLabel(status) {
  const key = String(status || "").trim();
  const map = {
    requested: "受付済み",
    confirmed: "確定",
    scheduled: "変更待ち",
    cancelled: "キャンセル",
    completed: "完了",
  };
  return map[key] || key || "-";
}

function registrationStatusLabel(value) {
  const key = String(value || "").trim();
  const map = {
    start_pending_profile: "登録途中",
    profile_pending_consent: "同意待ち",
    consent_pending_profile: "プロフィール待ち",
    completed: "登録完了",
  };
  return map[key] || key || "-";
}

function accountStatusLabel(student) {
  if (student.registrationStatus !== "completed") return "登録途中";
  const remaining = Number(student.lessonMinutes?.remainingMinutes || 0);
  if (remaining > 0) return "受講中";
  return "休会中";
}

function lessonDeliveryTypeLabel(value) {
  return String(value || "") === "online" ? "オンライン" : "対面";
}

function noteStatusLabel(note) {
  if (!note) return "-";
  if (note.isSharedToStudents === false) return "下書き";
  return "公開済み";
}

function reservationSortAsc(a, b) {
  return `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`);
}

function reservationSortDesc(a, b) {
  return `${b.date || ""} ${b.time || ""}`.localeCompare(`${a.date || ""} ${a.time || ""}`);
}

export default function StudentEditForm({
  student,
  initialReservations = [],
  initialLessonNotes = [],
  initialNotices = [],
  initialLearningStats = null,
  initialPaymentDetail = null,
  registrationAuditHints = null,
  initialRiskBadges = [],
}) {
  const profile = student.crmProfile || {};
  const lessonMinutePackages = student.lessonMinutePackages || [];
  const activeLessonMinutePackages = lessonMinutePackages.filter((pkg) => pkg.isActive);

  const [nameKanji, setNameKanji] = useState(student.nameKanji || "");
  const [nameFurigana, setNameFurigana] = useState(student.nameFurigana || "");
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(profile.addressLine2 || "");
  const [postalCode, setPostalCode] = useState(profile.postalCode || "");
  const [birthDate, setBirthDate] = useState(profile.birthDate || "");
  const [nameKorean, setNameKorean] = useState(profile.nameKorean || "");
  const [phoneMobile, setPhoneMobile] = useState(profile.phoneMobile || "");
  const [phoneEmergency, setPhoneEmergency] = useState(profile.phoneEmergency || "");
  const emergencyInitial = parseEmergencyRelation(
    profile.emergencyContactRelation,
    profile.emergencyContactName,
    profile.emergencyContactNameFurigana
  );
  const [emergencyContactName, setEmergencyContactName] = useState(emergencyInitial.nameKanji);
  const [emergencyContactNameFurigana, setEmergencyContactNameFurigana] = useState(emergencyInitial.nameFurigana);
  const [emergencyRelationPreset, setEmergencyRelationPreset] = useState(emergencyInitial.preset);
  const [emergencyRelationOther, setEmergencyRelationOther] = useState(emergencyInitial.otherText);
  const [notes, setNotes] = useState(profile.notes || "");
  const [adminStudentTendency, setAdminStudentTendency] = useState(profile.adminStudentTendency || "");
  const [adminLessonCautions, setAdminLessonCautions] = useState(profile.adminLessonCautions || "");
  const [adminResponseStyle, setAdminResponseStyle] = useState(profile.adminResponseStyle || "");
  const [adminLearningTraits, setAdminLearningTraits] = useState(profile.adminLearningTraits || "");
  const [adminCounselMemo, setAdminCounselMemo] = useState(profile.adminCounselMemo || "");

  const [registrationStatus, setRegistrationStatus] = useState(
    student.registrationStatus || "start_pending_profile"
  );
  const [consentStatus, setConsentStatus] = useState(student.consentStatus || "pending");
  const [isMinor, setIsMinor] = useState(Boolean(student.isMinor));
  const [guardianRequired, setGuardianRequired] = useState(Boolean(student.guardianRequired));
  const [guardianMemo, setGuardianMemo] = useState(student.guardianMemo || "");
  const [lessonMinutes, setLessonMinutes] = useState(student.lessonMinutes || null);
  const [lessonMinuteLogs, setLessonMinuteLogs] = useState(student.lessonMinuteLogs || []);
  const [lessonMinuteLedger, setLessonMinuteLedger] = useState(student.lessonMinuteLedger || []);
  const [lessonMinuteJournalCharges, setLessonMinuteJournalCharges] = useState(
    student.lessonMinuteJournalCharges || []
  );
  const [lessonMinuteJournalUsage, setLessonMinuteJournalUsage] = useState(student.lessonMinuteJournalUsage || []);
  const [lessonMinuteJournalManual, setLessonMinuteJournalManual] = useState(
    student.lessonMinuteJournalManual || []
  );
  const [lessonMinuteJournalSummary, setLessonMinuteJournalSummary] = useState(
    student.lessonMinuteJournalSummary || null
  );
  const [lessonMinutesCreditMinutes, setLessonMinutesCreditMinutes] = useState("0");
  const [lessonMinutesCreditPackageId, setLessonMinutesCreditPackageId] = useState("");
  const [lessonMinutesCreditType, setLessonMinutesCreditType] = useState("purchase");
  const [lessonMinutesCreditReason, setLessonMinutesCreditReason] = useState("");
  const [lessonMinutesAdjustMinutes, setLessonMinutesAdjustMinutes] = useState("0");
  const [lessonMinutesAdjustReason, setLessonMinutesAdjustReason] = useState("");
  const [lessonMinutesDeductMinutes, setLessonMinutesDeductMinutes] = useState("0");
  const [lessonMinutesDeductMemo, setLessonMinutesDeductMemo] = useState("");
  const [lessonMinutesApplyLoading, setLessonMinutesApplyLoading] = useState(false);
  const [pairAction, setPairAction] = useState("none");
  const [pairStudentId, setPairStudentId] = useState("");
  const [pairInfo, setPairInfo] = useState(student.pairInfo || null);
  const [pairHistory, setPairHistory] = useState(student.pairHistory || []);
  const [parentLinks, setParentLinks] = useState(student.parentLinks || []);
  const [parentAction, setParentAction] = useState("none");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentRelationship, setParentRelationship] = useState("保護者");
  const [parentLinkId, setParentLinkId] = useState("");
  const [parentIsPrimary, setParentIsPrimary] = useState(false);
  const [parentCanViewReservations, setParentCanViewReservations] = useState(true);
  const [parentCanViewLessonNotes, setParentCanViewLessonNotes] = useState(true);
  const [parentCanViewHomework, setParentCanViewHomework] = useState(true);
  const [parentCanViewPayments, setParentCanViewPayments] = useState(true);
  const [parentCanReceiveNotifications, setParentCanReceiveNotifications] = useState(true);
  const [pairCandidates, setPairCandidates] = useState([]);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [reservationScope, setReservationScope] = useState("upcoming");
  const [reservationActionLoadingId, setReservationActionLoadingId] = useState("");
  const [reservationRows, setReservationRows] = useState(initialReservations || []);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [learningPeriod, setLearningPeriod] = useState("30");
  const [learningStats, setLearningStats] = useState(initialLearningStats);
  const [learningStatsLoading, setLearningStatsLoading] = useState(false);
  const [paymentDetail, setPaymentDetail] = useState(initialPaymentDetail);
  const [indTemplateId, setIndTemplateId] = useState(
    () => initialPaymentDetail?.templates?.[0]?.id || ""
  );
  const [indEffectiveFrom, setIndEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 16));
  const [indMemo, setIndMemo] = useState("");
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentMsg, setAssignmentMsg] = useState("");

  const paymentRollup = useMemo(() => {
    const txns = paymentDetail?.transactions || [];
    if (txns.length === 0) {
      return { count: 0, totalAmount: 0, totalPoints: 0, lastPaidAt: null, anyRyoshu: false };
    }
    let totalAmount = 0;
    let totalPoints = 0;
    for (const t of txns) {
      totalAmount += Number(t.amountTaxInclusive || 0);
      totalPoints += Number(t.finalPoints || 0);
    }
    const lastPaidAt = txns[0]?.paidAt || null;
    const anyRyoshu = txns.some((t) => Boolean(t.ryoshuIssuedAt));
    return { count: txns.length, totalAmount, totalPoints, lastPaidAt, anyRyoshu };
  }, [paymentDetail?.transactions]);

  const reservations = useMemo(() => [...(reservationRows || [])].sort(reservationSortDesc), [reservationRows]);
  const lessonNotes = useMemo(
    () =>
      [...(initialLessonNotes || [])].sort((a, b) =>
        String(b.date || b.updatedAt || "").localeCompare(String(a.date || a.updatedAt || ""))
      ),
    [initialLessonNotes]
  );
  const notices = useMemo(
    () =>
      [...(initialNotices || [])].sort((a, b) =>
        String(b.publishedAt || b.updatedAt || "").localeCompare(String(a.publishedAt || a.updatedAt || ""))
      ),
    [initialNotices]
  );

  useEffect(() => {
    let active = true;
    async function loadCandidates() {
      try {
        const response = await fetch("/api/admin/students?page=1&pageSize=200");
        const data = await response.json();
        if (!response.ok || !data?.ok || !active) return;
        const rows = (data.students || []).filter((item) => item.id !== student.id);
        setPairCandidates(rows);
      } catch {
        if (active) setPairCandidates([]);
      }
    }
    loadCandidates();
    return () => {
      active = false;
    };
  }, [student.id]);

  const selectedPairStudent = useMemo(
    () => pairCandidates.find((item) => item.id === pairStudentId) || null,
    [pairCandidates, pairStudentId]
  );
  const selectedParentLink = useMemo(
    () => parentLinks.find((item) => item.id === parentLinkId) || null,
    [parentLinks, parentLinkId]
  );

  const nowKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  }, []);

  const upcomingReservations = useMemo(
    () =>
      reservations
        .filter((row) => String(row.status || "") !== "cancelled")
        .filter((row) => `${row.date || ""} ${row.time || ""}` >= nowKey)
        .sort(reservationSortAsc),
    [reservations, nowKey]
  );
  const pastReservations = useMemo(
    () =>
      reservations
        .filter((row) => `${row.date || ""} ${row.time || ""}` < nowKey || String(row.status || "") === "cancelled")
        .sort(reservationSortDesc),
    [reservations, nowKey]
  );
  const visibleReservations = useMemo(() => {
    if (reservationScope === "all") return reservations;
    if (reservationScope === "past") return pastReservations;
    return upcomingReservations;
  }, [reservationScope, reservations, pastReservations, upcomingReservations]);
  const latestReservation = useMemo(() => (reservations.length > 0 ? reservations[0] : null), [reservations]);
  const nextReservation = useMemo(
    () => (upcomingReservations.length > 0 ? upcomingReservations[0] : null),
    [upcomingReservations]
  );
  const nextConfirmedReservation = useMemo(
    () =>
      [...reservations]
        .filter((r) => ["requested", "confirmed"].includes(String(r.status || "").trim()))
        .sort(reservationSortAsc)[0] || null,
    [reservations]
  );
  const adminLessonMinutesPreview = useMemo(
    () =>
      buildLessonMinutesCompletionPreview({
        remainingMinutes: lessonMinutes?.remainingMinutes ?? 0,
        nextReservation: nextConfirmedReservation,
      }),
    [lessonMinutes?.remainingMinutes, nextConfirmedReservation]
  );
  const heroLessonMinuteAlerts = useMemo(() => {
    const rem = Number(lessonMinutes?.remainingMinutes ?? 0);
    const items = [];
    if (rem <= 0) {
      items.push({
        tone: "danger",
        text: "残りレッスン時間が0以下です。受講前に付与・調整をご確認ください。",
      });
    } else if (rem <= 180) {
      items.push({
        tone: "warn",
        text: "残りレッスン時間が180分以下です。継続受講の案内を検討してください。",
      });
    }
    if (adminLessonMinutesPreview.nextCompletionInsufficient) {
      items.push({
        tone: "warn",
        text: "次回の確定・受付中の予約に対し、残り時間が不足する見込みです。",
      });
    }
    return items;
  }, [lessonMinutes?.remainingMinutes, adminLessonMinutesPreview.nextCompletionInsufficient]);
  const latestLessonNote = useMemo(() => (lessonNotes.length > 0 ? lessonNotes[0] : null), [lessonNotes]);
  const activeParentCount = useMemo(
    () => parentLinks.filter((item) => item.status === "active").length,
    [parentLinks]
  );
  const cautionExists = Boolean(
    adminCounselMemo ||
      adminLessonCautions ||
      adminLearningTraits ||
      adminStudentTendency ||
      adminResponseStyle ||
      guardianMemo
  );

  useEffect(() => {
    if (parentAction !== "update") return;
    if (!selectedParentLink) return;
    setParentRelationship(selectedParentLink.relationship || "保護者");
    setParentPhone(selectedParentLink.parentPhone || "");
    setParentIsPrimary(Boolean(selectedParentLink.isPrimary));
    setParentCanViewReservations(Boolean(selectedParentLink.canViewReservations));
    setParentCanViewLessonNotes(Boolean(selectedParentLink.canViewLessonNotes));
    setParentCanViewHomework(Boolean(selectedParentLink.canViewHomework));
    setParentCanViewPayments(Boolean(selectedParentLink.canViewPayments));
    setParentCanReceiveNotifications(Boolean(selectedParentLink.canReceiveNotifications));
  }, [parentAction, selectedParentLink]);

  useEffect(() => {
    setReservationRows(initialReservations || []);
  }, [initialReservations]);

  useEffect(() => {
    setLessonMinuteJournalCharges(student.lessonMinuteJournalCharges || []);
    setLessonMinuteJournalUsage(student.lessonMinuteJournalUsage || []);
    setLessonMinuteJournalManual(student.lessonMinuteJournalManual || []);
    setLessonMinuteJournalSummary(student.lessonMinuteJournalSummary || null);
  }, [student.id]);

  useEffect(() => {
    let active = true;
    async function loadNotificationLogs() {
      setNotificationLoading(true);
      try {
        const activeParents = parentLinks.filter((item) => item.status === "active");
        const requests = [
          fetch(`/api/admin/mail-logs?studentId=${encodeURIComponent(student.id)}&page=1&pageSize=60`, {
            cache: "no-store",
          })
            .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
            .catch(() => ({ ok: false, data: null })),
          ...activeParents.map((item) =>
            fetch(`/api/admin/mail-logs?parentId=${encodeURIComponent(item.parentId)}&page=1&pageSize=40`, {
              cache: "no-store",
            })
              .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
              .catch(() => ({ ok: false, data: null }))
          ),
        ];
        const results = await Promise.all(requests);
        if (!active) return;
        const merged = [];
        results.forEach((result) => {
          if (!result.ok || !result.data?.ok) return;
          const items = Array.isArray(result.data.items) ? result.data.items : [];
          merged.push(...items);
        });
        const deduped = [];
        const seen = new Set();
        merged
          .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
          .forEach((item) => {
            if (seen.has(item.id)) return;
            seen.add(item.id);
            deduped.push(item);
          });
        setNotificationLogs(deduped.slice(0, 80));
      } finally {
        if (active) setNotificationLoading(false);
      }
    }
    loadNotificationLogs();
    return () => {
      active = false;
    };
  }, [student?.email, parentLinks]);

  useEffect(() => {
    let active = true;
    async function loadLearningStats() {
      if (learningPeriod === "30" && initialLearningStats) {
        setLearningStats(initialLearningStats);
        return;
      }
      setLearningStatsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/students/${student.id}/learning-stats?period=${encodeURIComponent(learningPeriod)}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok || !data?.ok) return;
        if (!active) return;
        setLearningStats(data.stats || null);
      } finally {
        if (active) setLearningStatsLoading(false);
      }
    }
    loadLearningStats();
    return () => {
      active = false;
    };
  }, [student.id, learningPeriod, initialLearningStats]);

  async function handleLessonMinutesApply(event) {
    event.preventDefault();
    event.stopPropagation();
    const credit = Number(lessonMinutesCreditMinutes || 0);
    const deduct = Math.max(0, Math.floor(Number(lessonMinutesDeductMinutes || 0)));
    const adjust = Number(lessonMinutesAdjustMinutes || 0);
    if (credit <= 0 && deduct <= 0 && adjust === 0) {
      setStatus({ type: "error", text: "追加・減算・手動調整のいずれかを入力してください。" });
      return;
    }
    if (credit > 0 && !String(lessonMinutesCreditReason || "").trim()) {
      setStatus({ type: "error", text: "時間追加には理由（メモ）の入力が必要です。" });
      return;
    }
    if (deduct > 0 && !String(lessonMinutesDeductMemo || "").trim()) {
      setStatus({ type: "error", text: "時間減算にはメモ（理由）の入力が必要です。" });
      return;
    }
    if (adjust !== 0 && !String(lessonMinutesAdjustReason || "").trim()) {
      setStatus({ type: "error", text: "手動調整には理由の入力が必要です。" });
      return;
    }
    const rem = Number(lessonMinutes?.remainingMinutes ?? 0);
    if (deduct > rem && rem >= 0) {
      const ok = typeof window !== "undefined" && window.confirm(
        "減算しようとしている分数が現在の残りを超えています。実際の減算は残り時間までに制限されます。このまま記録しますか？"
      );
      if (!ok) return;
    }
    if (credit >= 3000 || deduct >= 3000 || Math.abs(adjust) >= 3000) {
      const ok2 = typeof window !== "undefined" && window.confirm(
        "入力された分数が大きいです。内容を再確認のうえ、続行しますか？"
      );
      if (!ok2) return;
    }
    setLessonMinutesApplyLoading(true);
    setStatus({ type: "", text: "" });
    try {
      const opId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `lm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonMinutesCreditMinutes: credit,
          lessonMinutesCreditPackageId,
          lessonMinutesCreditType,
          lessonMinutesCreditReason,
          lessonMinutesDeductMinutes: deduct,
          lessonMinutesDeductReason: String(lessonMinutesDeductMemo || "").trim(),
          lessonMinutesAdjustMinutes: adjust,
          lessonMinutesAdjustReason,
          lessonMinutesOperationId: opId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "レッスン時間の更新に失敗しました。");
      }
      setLessonMinutes(data.student?.lessonMinutes || lessonMinutes);
      setLessonMinuteLogs(data.student?.lessonMinuteLogs || lessonMinuteLogs);
      setLessonMinuteLedger(data.student?.lessonMinuteLedger || lessonMinuteLedger);
      setLessonMinuteJournalCharges(data.student?.lessonMinuteJournalCharges || lessonMinuteJournalCharges);
      setLessonMinuteJournalUsage(data.student?.lessonMinuteJournalUsage || lessonMinuteJournalUsage);
      setLessonMinuteJournalManual(data.student?.lessonMinuteJournalManual || lessonMinuteJournalManual);
      setLessonMinuteJournalSummary(data.student?.lessonMinuteJournalSummary ?? lessonMinuteJournalSummary);
      setLessonMinutesCreditMinutes("0");
      setLessonMinutesCreditPackageId("");
      setLessonMinutesCreditType("purchase");
      setLessonMinutesCreditReason("");
      setLessonMinutesDeductMinutes("0");
      setLessonMinutesDeductMemo("");
      setLessonMinutesAdjustMinutes("0");
      setLessonMinutesAdjustReason("");
      setStatus({ type: "success", text: "レッスン時間を更新しました。" });
    } catch (err) {
      setStatus({ type: "error", text: err.message || "レッスン時間の更新に失敗しました。" });
    } finally {
      setLessonMinutesApplyLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameKanji,
          nameFurigana,
          addressLine1,
          addressLine2,
          postalCode,
          birthDate,
          nameKorean,
          phoneMobile,
          phoneEmergency,
          emergencyContactName,
          emergencyContactNameFurigana,
          emergencyContactRelation: emergencyRelationToStore(emergencyRelationPreset, emergencyRelationOther),
          notes,
          adminStudentTendency,
          adminLessonCautions,
          adminResponseStyle,
          adminLearningTraits,
          adminCounselMemo,
          registrationStatus,
          consentStatus,
          isMinor,
          guardianRequired,
          guardianMemo,
          pairAction,
          pairStudentId,
          parentAction,
          parentEmail,
          parentPhone,
          parentRelationship,
          parentLinkId,
          parentIsPrimary,
          parentCanViewReservations,
          parentCanViewLessonNotes,
          parentCanViewHomework,
          parentCanViewPayments,
          parentCanReceiveNotifications,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "学生情報の更新に失敗しました。");
      }
      setLessonMinutes(data.student?.lessonMinutes || lessonMinutes);
      setLessonMinuteLogs(data.student?.lessonMinuteLogs || lessonMinuteLogs);
      setLessonMinuteLedger(data.student?.lessonMinuteLedger || lessonMinuteLedger);
      setLessonMinuteJournalCharges(data.student?.lessonMinuteJournalCharges || lessonMinuteJournalCharges);
      setLessonMinuteJournalUsage(data.student?.lessonMinuteJournalUsage || lessonMinuteJournalUsage);
      setLessonMinuteJournalManual(data.student?.lessonMinuteJournalManual || lessonMinuteJournalManual);
      setLessonMinuteJournalSummary(data.student?.lessonMinuteJournalSummary ?? lessonMinuteJournalSummary);
      setPairAction("none");
      setPairStudentId("");
      setPairInfo(data.student?.pairInfo || null);
      setPairHistory(data.student?.pairHistory || []);
      setParentLinks(data.student?.parentLinks || []);
      setParentAction("none");
      setParentEmail("");
      setParentPhone("");
      setParentRelationship("保護者");
      setParentLinkId("");
      setParentIsPrimary(false);
      setParentCanViewReservations(true);
      setParentCanViewLessonNotes(true);
      setParentCanViewHomework(true);
      setParentCanViewPayments(true);
      setParentCanReceiveNotifications(true);
      const provisioning = data.student?.parentProvisioning;
      if (provisioning) {
        setStatus({
          type: "success",
          text: provisioning?.temporaryPassword
            ? `学生情報を保存しました。保護者初期パスワード: ${provisioning.temporaryPassword} (${provisioning.initialPasswordHint || "-"})`
            : `学生情報を保存しました。保護者初期化方式: ${provisioning.initialPasswordHint || "-"}`,
        });
      } else {
        setStatus({ type: "success", text: "学生情報を保存しました。" });
      }
    } catch (error) {
      setStatus({ type: "error", text: error.message || "保存中にエラーが発生しました。" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateReservationStatus(reservationId, nextStatus) {
    setReservationActionLoadingId(reservationId);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "予約状態変更に失敗しました。");
      }
      setReservationRows((prev) =>
        prev.map((row) => (row.id === reservationId ? { ...row, status: data.reservation?.status || nextStatus } : row))
      );
      setStatus({ type: "success", text: "予約状態を更新しました。" });
    } catch (error) {
      setStatus({ type: "error", text: error.message || "予約状態変更中にエラーが発生しました。" });
    } finally {
      setReservationActionLoadingId("");
    }
  }

  async function handleResetTemporaryPassword() {
    if (!window.confirm("この学生の一時パスワードを再設定しますか？(システム設定ポリシー適用)")) return;
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch(`/api/admin/students/${student.id}/reset-password`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "一時パスワード再設定に失敗しました。");
      }
      setStatus({
        type: "success",
        text: data?.temporaryPassword
          ? `一時パスワードを再設定しました。仮パスワード: ${data.temporaryPassword} / 次回ログイン時に変更が必要です。`
          : "一時パスワードを再設定しました。次回ログイン時にパスワード変更が必要です。",
      });
    } catch (error) {
      setStatus({ type: "error", text: error.message || "一時パスワード再設定中にエラーが発生しました。" });
    }
  }

  async function handleAssignIndividualPaymentRule() {
    if (!indTemplateId) {
      setAssignmentMsg("テンプレートを選択してください。");
      return;
    }
    setAssignmentSaving(true);
    setAssignmentMsg("");
    try {
      const response = await fetch("/api/admin/payments/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          assignment: {
            studentId: student.id,
            kind: "individual",
            templateId: indTemplateId,
            effectiveFrom: new Date(indEffectiveFrom).toISOString(),
            memo: indMemo,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "個別ルールの適用に失敗しました。");
      }
      setAssignmentMsg("個別ルールを適用しました。今後の決済から反映されます。");
      const r2 = await fetch(`/api/admin/payments/student-detail?studentId=${encodeURIComponent(student.id)}`);
      const d2 = await r2.json();
      if (r2.ok && d2?.ok) {
        const { ok: _ok, ...rest } = d2;
        setPaymentDetail(rest);
      }
    } catch (error) {
      setAssignmentMsg(error.message || "エラーが発生しました。");
    } finally {
      setAssignmentSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={detailStyles.formRoot}>
      <section className={detailStyles.headerGrid}>
        <div className={detailStyles.heroCard}>
          <div className={detailStyles.heroHead}>
            <div>
              <h2 className={detailStyles.studentName}>{student.nameKanji || "-"}</h2>
              <p className={detailStyles.studentSub}>
                {student.nameFurigana || "-"} / 会員番号 {student.studentNumber || "-"}
              </p>
            </div>
            <span className={`${adminStyles.statusPill} ${adminStyles.statusGood}`}>
              {accountStatusLabel(student)}
            </span>
          </div>
          <div className={detailStyles.heroMetaGrid}>
            <p>
              <strong>登録状態:</strong> {registrationStatusLabel(student.registrationStatus)}
            </p>
            <p>
              <strong>最近の予約:</strong>{" "}
              {latestReservation
                ? `${latestReservation.date || "-"} ${latestReservation.time || "-"} / ${reservationStatusLabel(
                    latestReservation.status
                  )}`
                : "なし"}
            </p>
            <p>
              <strong>最終ログイン:</strong> {formatDateTime(student.linkedUserLastLoginAt)}
            </p>
            <p>
              <strong>保護者連携:</strong> {activeParentCount > 0 ? `${activeParentCount}件` : "なし"}
            </p>
          </div>
          <StudentRiskStrip badges={initialRiskBadges} />
          {heroLessonMinuteAlerts.length > 0 ? (
            <div className={detailStyles.minutesHeroAlertStack} aria-label="レッスン時間の注意">
              {heroLessonMinuteAlerts.map((a, idx) => (
                <p key={`${a.tone}-${idx}`} className={detailStyles.minutesHeroAlert} data-tone={a.tone}>
                  {a.text}
                </p>
              ))}
            </div>
          ) : null}
          <div className={detailStyles.quickActions}>
            <button className={adminStyles.chipButton} type="button" onClick={() => setActiveTab("lesson-time")}>
              レッスン時間を編集
            </button>
            <a className={adminStyles.actionButton} href={`/admin/reservations?studentId=${student.id}`}>
              予約を追加
            </a>
            <a className={adminStyles.actionButton} href={`/admin/lesson-notes?studentId=${student.id}`}>
              レッスンノートを見る
            </a>
            <button className={adminStyles.chipButton} type="button" onClick={() => setActiveTab("basic")}>
              基本情報を編集
            </button>
            <button className={adminStyles.chipButton} type="button" onClick={handleResetTemporaryPassword}>
              一時パスワードを再設定
            </button>
          </div>
        </div>
        <aside className={detailStyles.summaryCard}>
          <h3 className={detailStyles.summaryTitle}>運営サマリー</h3>
          <ul className={detailStyles.summaryList}>
            <li>今後の予約数: {upcomingReservations.length}件</li>
            <li>過去受講回数: {pastReservations.filter((item) => item.status === "completed").length}件</li>
            <li>最新ノート日: {latestLessonNote?.date || "-"}</li>
            <li>保護者連携: {activeParentCount > 0 ? "あり" : "なし"}</li>
            <li>未対応メモ: {cautionExists ? "あり" : "なし"}</li>
          </ul>
          <p className={adminStyles.smallMuted}>
            次回授業:{" "}
            {nextReservation
              ? `${nextReservation.date || "-"} ${nextReservation.time || "-"} (${lessonDeliveryTypeLabel(
                  nextReservation.lessonDeliveryType
                )})`
              : "未定"}
          </p>
        </aside>
      </section>
      <div className={detailStyles.tabRow}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${detailStyles.tabButton} ${activeTab === tab.id ? detailStyles.tabButtonActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <StudentRecentFlowSummary studentId={student.id} apiRole="admin" />

      <RegistrationProgressPanel student={student} auditHints={registrationAuditHints} />

      {activeTab === "basic" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>基本情報カード</h3>
          <div className={detailStyles.infoGrid}>
            <p><strong>名前:</strong> {student.nameKanji || "-"}</p>
            <p><strong>フリガナ:</strong> {student.nameFurigana || "-"}</p>
            <p><strong>メール:</strong> {student.email || "-"}</p>
            <p><strong>電話番号:</strong> {student.phone || profile.phoneMobile || "-"}</p>
            <p><strong>学生番号:</strong> {student.studentNumber || "-"}</p>
            <p><strong>登録日:</strong> {formatDateTime(student.studentUpdatedAt)}</p>
            <p><strong>生年月日:</strong> {birthDate || "-"}</p>
            <p><strong>アカウント状態:</strong> {accountStatusLabel(student)}</p>
            <p><strong>ログインID:</strong> {student.linkedUserEmail || "未連携"}</p>
            <p><strong>同意状態:</strong> {consentStatus === "agreed" ? "同意済み" : "未同意"}</p>
            <p><strong>保護者連携:</strong> {activeParentCount > 0 ? "連携あり" : "未連携"}</p>
            <p>
              <strong>現在ペア:</strong>{" "}
              {pairInfo?.partner
                ? `${pairInfo.partner.nameKanji || "-"} (${pairInfo.partner.studentNumber || "-"})`
                : "なし"}
            </p>
          </div>

          <h4 className={detailStyles.blockTitle}>基本情報編集</h4>
          <div className={detailStyles.formGrid}>
            <label className={styles.label}>
              漢字氏名
              <input className={styles.field} value={nameKanji} onChange={(e) => setNameKanji(e.target.value)} />
            </label>
            <label className={styles.label}>
              フリガナ
              <input className={styles.field} value={nameFurigana} onChange={(e) => setNameFurigana(e.target.value)} />
            </label>
            <label className={styles.label}>
              郵便番号
              <input className={styles.field} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </label>
            <label className={styles.label}>
              生年月日
              <input className={styles.field} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </label>
            <label className={styles.label}>
              住所 1
              <input className={styles.field} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
            </label>
            <label className={styles.label}>
              住所 2
              <input className={styles.field} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </label>
            <label className={styles.label}>
              韓国語氏名
              <input className={styles.field} value={nameKorean} onChange={(e) => setNameKorean(e.target.value)} />
            </label>
            <label className={styles.label}>
              携帯電話
              <input className={styles.field} value={phoneMobile} onChange={(e) => setPhoneMobile(e.target.value)} />
            </label>
            <label className={styles.label}>
              緊急連絡先
              <input className={styles.field} value={phoneEmergency} onChange={(e) => setPhoneEmergency(e.target.value)} />
            </label>
            <label className={styles.label}>
              緊急連絡先の氏名（漢字）
              <input
                className={styles.field}
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              緊急連絡先の氏名（ふりがな）
              <input
                className={styles.field}
                value={emergencyContactNameFurigana}
                onChange={(e) => setEmergencyContactNameFurigana(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              続柄
              <select
                className={styles.field}
                value={emergencyRelationPreset || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmergencyRelationPreset(v);
                  if (v !== "その他") setEmergencyRelationOther("");
                }}
              >
                <option value="">選択してください</option>
                {EMERGENCY_RELATION_PRESETS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            {emergencyRelationPreset === "その他" ? (
              <label className={styles.label}>
                続柄（その他の内容）
                <input
                  className={styles.field}
                  value={emergencyRelationOther}
                  onChange={(e) => setEmergencyRelationOther(e.target.value)}
                  placeholder="続柄を具体的に入力"
                />
              </label>
            ) : null}
            <label className={styles.label}>
              メモ用タグ / 備考
              <input className={styles.field} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <label className={styles.label}>
              登録状態
              <select className={styles.field} value={registrationStatus} onChange={(e) => setRegistrationStatus(e.target.value)}>
                <option value="start_pending_profile">start_pending_profile</option>
                <option value="profile_pending_consent">profile_pending_consent</option>
                <option value="completed">completed</option>
              </select>
            </label>
            <label className={styles.label}>
              同意状態
              <select className={styles.field} value={consentStatus} onChange={(e) => setConsentStatus(e.target.value)}>
                <option value="pending">pending</option>
                <option value="agreed">agreed</option>
              </select>
            </label>
            <label className={styles.label}>
              未成年フラグ
              <select className={styles.field} value={isMinor ? "yes" : "no"} onChange={(e) => setIsMinor(e.target.value === "yes")}>
                <option value="no">no</option>
                <option value="yes">yes</option>
              </select>
            </label>
            <label className={styles.label}>
              保護者必須フラグ
              <select
                className={styles.field}
                value={guardianRequired ? "yes" : "no"}
                onChange={(e) => setGuardianRequired(e.target.value === "yes")}
              >
                <option value="no">no</option>
                <option value="yes">yes</option>
              </select>
            </label>
            <label className={styles.label}>
              保護者メモ
              <input
                className={styles.field}
                value={guardianMemo}
                onChange={(e) => setGuardianMemo(e.target.value)}
                placeholder="例: 未成年のため保護者連携必須"
              />
            </label>
          </div>

          <h4 className={detailStyles.blockTitle}>ペア管理</h4>
          <div className={detailStyles.infoGrid}>
            <p><strong>状態:</strong> {pairInfo?.status === "active" ? "有効" : "未設定 / 解除済み"}</p>
            <p><strong>会員番号:</strong> {pairInfo?.partner?.studentNumber || "-"}</p>
            <p><strong>氏名:</strong> {pairInfo?.partner?.nameKanji || "-"}</p>
            <p><strong>メール:</strong> {pairInfo?.partner?.email || "-"}</p>
            <p><strong>電話:</strong> {pairInfo?.partner?.phone || "-"}</p>
          </div>
          <div className={detailStyles.formGrid}>
            <label className={styles.label}>
              ペア操作
              <select className={styles.field} value={pairAction} onChange={(e) => setPairAction(e.target.value)}>
                <option value="none">変更なし</option>
                <option value="link">ペアを設定/再設定</option>
                <option value="unlink">現在ペアを解除</option>
              </select>
            </label>
            {pairAction === "link" ? (
              <label className={styles.label}>
                ペア相手の学生
                <select className={styles.field} value={pairStudentId} onChange={(e) => setPairStudentId(e.target.value)}>
                  <option value="">選択してください</option>
                  {pairCandidates.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.studentNumber || "-"} / {row.nameKanji || "-"} / {row.email || "-"}
                    </option>
                  ))}
                </select>
                {selectedPairStudent ? (
                  <span className={adminStyles.smallMuted}>
                    選択中: {selectedPairStudent.nameKanji || "-"} ({selectedPairStudent.studentNumber || "-"})
                  </span>
                ) : null}
              </label>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "reservations" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>予約タブ</h3>
          <div className={detailStyles.inlineActions}>
            <button
              className={`${adminStyles.chipButton} ${reservationScope === "upcoming" ? adminStyles.chipButtonActive : ""}`}
              type="button"
              onClick={() => setReservationScope("upcoming")}
            >
              今後の予約
            </button>
            <button
              className={`${adminStyles.chipButton} ${reservationScope === "past" ? adminStyles.chipButtonActive : ""}`}
              type="button"
              onClick={() => setReservationScope("past")}
            >
              過去の予約
            </button>
            <button
              className={`${adminStyles.chipButton} ${reservationScope === "all" ? adminStyles.chipButtonActive : ""}`}
              type="button"
              onClick={() => setReservationScope("all")}
            >
              全体
            </button>
            <a className={adminStyles.actionButton} href={`/admin/reservations?studentId=${student.id}`}>
              予約管理へ
            </a>
          </div>
          <div className={detailStyles.stackList}>
            {visibleReservations.map((reservation) => (
              <article key={reservation.id} className={detailStyles.itemCard}>
                <p><strong>予約日時:</strong> {reservation.date || "-"} {reservation.time || "-"}</p>
                <p><strong>担当講師:</strong> {reservation.instructorName || "-"}</p>
                <p><strong>レッスン形式:</strong> {lessonDeliveryTypeLabel(reservation.lessonDeliveryType)}</p>
                <p><strong>状態:</strong> {reservationStatusLabel(reservation.status)}</p>
                <p><strong>備考:</strong> {reservation.memo || "-"}</p>
                <div className={detailStyles.inlineActions}>
                  <button
                    type="button"
                    className={adminStyles.chipButton}
                    disabled={reservationActionLoadingId === reservation.id}
                    onClick={() => handleUpdateReservationStatus(reservation.id, "confirmed")}
                  >
                    確定
                  </button>
                  <button
                    type="button"
                    className={adminStyles.chipButton}
                    disabled={reservationActionLoadingId === reservation.id}
                    onClick={() => handleUpdateReservationStatus(reservation.id, "completed")}
                  >
                    完了
                  </button>
                  <button
                    type="button"
                    className={adminStyles.chipButton}
                    disabled={reservationActionLoadingId === reservation.id}
                    onClick={() => handleUpdateReservationStatus(reservation.id, "cancelled")}
                  >
                    キャンセル
                  </button>
                  <a className={adminStyles.inlineLink} href={`/admin/reservations?studentId=${student.id}`}>
                    詳細管理へ
                  </a>
                </div>
              </article>
            ))}
            {visibleReservations.length === 0 ? <p className={adminStyles.smallMuted}>表示できる予約がありません。</p> : null}
          </div>
        </section>
      ) : null}

      {activeTab === "notes" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>レッスンノートタブ</h3>
          <div className={detailStyles.inlineActions}>
            <a className={adminStyles.actionButton} href={`/admin/lesson-notes?studentId=${student.id}`}>
              新規ノート作成へ
            </a>
          </div>
          <div className={detailStyles.stackList}>
            {lessonNotes.map((note) => (
              <article key={note.id} className={detailStyles.itemCard}>
                <p><strong>レッスン日:</strong> {note.date || "-"}</p>
                <p><strong>担当講師:</strong> {note.teacherUserId || "-"}</p>
                <p><strong>タイトル/テーマ:</strong> {note.title || note.summary || "-"}</p>
                <p><strong>状態:</strong> {noteStatusLabel(note)}</p>
                <p><strong>公開日時:</strong> {formatDateTime(note.updatedAt || note.createdAt)}</p>
                <p><strong>復習ポイント:</strong> {note.summary || "-"}</p>
                <div className={detailStyles.inlineActions}>
                  <a className={adminStyles.inlineLink} href={`/admin/lesson-notes?studentId=${student.id}`}>
                    ノートを開く
                  </a>
                </div>
              </article>
            ))}
            {lessonNotes.length === 0 ? <p className={adminStyles.smallMuted}>レッスンノートがありません。</p> : null}
          </div>
        </section>
      ) : null}

      {activeTab === "learning-stats" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>学習統計</h3>
          <div className={detailStyles.inlineActions}>
            <button
              type="button"
              className={`${adminStyles.chipButton} ${learningPeriod === "30" ? adminStyles.chipButtonActive : ""}`}
              onClick={() => setLearningPeriod("30")}
            >
              直近1ヶ月
            </button>
            <button
              type="button"
              className={`${adminStyles.chipButton} ${learningPeriod === "90" ? adminStyles.chipButtonActive : ""}`}
              onClick={() => setLearningPeriod("90")}
            >
              直近3ヶ月
            </button>
            <button
              type="button"
              className={`${adminStyles.chipButton} ${learningPeriod === "all" ? adminStyles.chipButtonActive : ""}`}
              onClick={() => setLearningPeriod("all")}
            >
              全期間
            </button>
          </div>
          {learningStatsLoading ? <p className={adminStyles.smallMuted}>統計を読み込み中...</p> : null}
          {learningStats ? (
            <>
              <div className={detailStyles.infoGrid}>
                <p><strong>総受講回数:</strong> {learningStats.summary?.totalLessonCount ?? 0}回</p>
                <p><strong>直近期間受講回数:</strong> {learningStats.summary?.periodLessonCount ?? 0}回</p>
                <p><strong>今月受講回数:</strong> {learningStats.summary?.monthLessonCount ?? 0}回</p>
                <p><strong>最新レッスン日:</strong> {learningStats.summary?.latestLessonDate || "-"}</p>
                <p><strong>最新レッスンノート日:</strong> {learningStats.summary?.latestLessonNoteDate || "-"}</p>
                <p><strong>現在の学習テーマ:</strong> {learningStats.summary?.currentLearningTheme || "-"}</p>
                <p><strong>宿題有無:</strong> {learningStats.summary?.recentHomeworkExists ? "あり" : "なし"}</p>
                <p><strong>宿題(全体):</strong> {learningStats.summary?.homeworkTotalCount ?? 0}件</p>
                <p><strong>宿題(完了):</strong> {learningStats.summary?.homeworkCompletedCount ?? 0}件</p>
                <p><strong>ノート公開数:</strong> {learningStats.summary?.lessonNoteSharedCount ?? 0}件</p>
              </div>

              <h4 className={detailStyles.blockTitle}>最近よく扱うテーマ</h4>
              <div className={detailStyles.inlineActions}>
                {(learningStats.recentThemes || []).map((theme) => (
                  <span key={`${theme.label}-${theme.count}`} className={adminStyles.statusPill}>
                    {theme.label} ({theme.count})
                  </span>
                ))}
                {(learningStats.recentThemes || []).length === 0 ? (
                  <span className={adminStyles.smallMuted}>テーマデータがありません。</span>
                ) : null}
              </div>

              <h4 className={detailStyles.blockTitle}>復習ポイント</h4>
              <div className={detailStyles.stackList}>
                {(learningStats.reviewPoints || []).map((point, index) => (
                  <article key={`review-${index}`} className={detailStyles.itemCard}>
                    <p>{point}</p>
                  </article>
                ))}
                {(learningStats.reviewPoints || []).length === 0 ? (
                  <p className={adminStyles.smallMuted}>復習ポイントがありません。</p>
                ) : null}
              </div>

              <h4 className={detailStyles.blockTitle}>宿題の流れ</h4>
              <div className={detailStyles.stackList}>
                {(learningStats.homeworkFlow || []).map((homework, index) => (
                  <article key={`homework-${index}`} className={detailStyles.itemCard}>
                    <p>{homework}</p>
                  </article>
                ))}
                {(learningStats.homeworkFlow || []).length === 0 ? (
                  <p className={adminStyles.smallMuted}>宿題データがありません。</p>
                ) : null}
              </div>

              <h4 className={detailStyles.blockTitle}>先生コメント / 次回方向</h4>
              <div className={detailStyles.stackList}>
                {(learningStats.teacherComments || []).map((comment, index) => (
                  <article key={`comment-${index}`} className={detailStyles.itemCard}>
                    <p>{comment}</p>
                  </article>
                ))}
                {(learningStats.teacherComments || []).length === 0 ? (
                  <p className={adminStyles.smallMuted}>コメントデータがありません。</p>
                ) : null}
              </div>
              <p className={adminStyles.smallMuted}>継続状況: {learningStats.continuityLabel || "-"}</p>
            </>
          ) : (
            <p className={adminStyles.smallMuted}>学習統計データがありません。</p>
          )}
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>決済・ルール</h3>
          <p className={adminStyles.smallMuted}>
            表示は保存済みの決済取引とルール適用履歴です。設定変更は今後の決済のみに効きます。
          </p>
          <div className={detailStyles.inlineActions}>
            <Link className={adminStyles.actionButton} href="/admin/payments/input">
              決済入力へ
            </Link>
            <Link className={adminStyles.inlineLink} href="/admin/payments/settings">
              決済設定（テンプレート）
            </Link>
          </div>

          <h4 className={detailStyles.blockTitle}>現在適用中</h4>
          <p>
            <strong>{paymentDetail?.currentRuleLabel || "—"}</strong>
            {paymentDetail?.currentTemplateId ? (
              <span className={adminStyles.smallMuted}>（テンプレート ID: {paymentDetail.currentTemplateId}）</span>
            ) : null}
          </p>

          <h4 className={detailStyles.blockTitle}>個別ルールを適用（この学生）</h4>
          <p className={adminStyles.smallMuted}>一括設定より個別が優先されます。</p>
          <div className={detailStyles.formGrid}>
            <label className={styles.label}>
              テンプレート
              <select
                className={styles.field}
                value={indTemplateId}
                onChange={(e) => setIndTemplateId(e.target.value)}
              >
                <option value="">選択してください</option>
                {(paymentDetail?.templates || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.baseYenAmount}円→{t.basePoints}pt）
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              適用開始
              <input
                className={styles.field}
                type="datetime-local"
                value={indEffectiveFrom}
                onChange={(e) => setIndEffectiveFrom(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              メモ
              <input className={styles.field} value={indMemo} onChange={(e) => setIndMemo(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            className={adminStyles.chipButton}
            disabled={assignmentSaving}
            onClick={handleAssignIndividualPaymentRule}
          >
            {assignmentSaving ? "適用中…" : "個別ルールを登録"}
          </button>
          {assignmentMsg ? <p className={adminStyles.smallMuted}>{assignmentMsg}</p> : null}

          <h4 className={detailStyles.blockTitle}>ルール適用履歴</h4>
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>種別</th>
                  <th>テンプレート</th>
                  <th>適用開始</th>
                  <th>適用終了</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {(paymentDetail?.assignmentHistory || []).map((row) => (
                  <tr key={row.id}>
                    <td>{row.kindLabel}</td>
                    <td>{row.templateName}</td>
                    <td>{formatDateTime(row.effectiveFrom)}</td>
                    <td>{row.effectiveTo ? formatDateTime(row.effectiveTo) : "現在有効"}</td>
                    <td>{row.memo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(paymentDetail?.assignmentHistory || []).length === 0 ? (
              <p className={adminStyles.smallMuted}>履歴がありません（基本設定のみ）。</p>
            ) : null}
          </div>

          <h4 className={detailStyles.blockTitle}>決済・付与履歴（確定データ）</h4>
          <div className={detailStyles.paymentSummaryStrip}>
            <div>
              <span className={adminStyles.smallMuted}>件数</span>
              <strong>{paymentRollup.count}</strong>
            </div>
            <div>
              <span className={adminStyles.smallMuted}>税込合計</span>
              <strong>{new Intl.NumberFormat("ja-JP").format(paymentRollup.totalAmount)} 円</strong>
            </div>
            <div>
              <span className={adminStyles.smallMuted}>付与PT合計</span>
              <strong>{new Intl.NumberFormat("ja-JP").format(paymentRollup.totalPoints)} pt</strong>
            </div>
            <div>
              <span className={adminStyles.smallMuted}>最近の決済</span>
              <strong>{paymentRollup.lastPaidAt ? formatDateTime(paymentRollup.lastPaidAt) : "—"}</strong>
            </div>
            <div>
              <span className={adminStyles.smallMuted}>領収書発行記録</span>
              <strong>{paymentRollup.anyRyoshu ? "あり" : "なし/未記録"}</strong>
            </div>
          </div>
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>区分</th>
                  <th>ステータス</th>
                  <th>税込</th>
                  <th>付与PT</th>
                  <th>換算分</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {(paymentDetail?.transactions || []).map((t) => (
                  <tr key={t.id}>
                    <td>{formatDateTime(t.paidAt)}</td>
                    <td>{jpStudentPaymentCategory(t)}</td>
                    <td>{jpPaymentStatus(t)}</td>
                    <td>{t.amountTaxInclusive}</td>
                    <td>{t.finalPoints}</td>
                    <td>{t.grantedMinutes}分</td>
                    <td>
                      <Link className={adminStyles.inlineLink} href={`/admin/payments/transactions/${t.id}`}>
                        詳細
                      </Link>
                      {" · "}
                      <Link className={adminStyles.inlineLink} href={`/admin/payments/receipt/${t.id}?kind=receipt`}>
                        レシート
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(paymentDetail?.transactions || []).length === 0 ? (
              <p className={adminStyles.smallMuted}>決済記録がありません。</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "parents" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>保護者タブ</h3>
          <div className={detailStyles.stackList}>
            {parentLinks
              .filter((item) => item.status === "active")
              .map((item) => (
                <article key={item.id} className={detailStyles.itemCard}>
                  <p><strong>保護者名:</strong> {item.parentDisplayName || "-"}</p>
                  <p><strong>フリガナ:</strong> -</p>
                  <p><strong>メール:</strong> {item.parentEmail || "-"}</p>
                  <p><strong>電話番号:</strong> {item.parentPhone || "-"}</p>
                  <p><strong>続柄:</strong> {item.relationship || "-"}</p>
                  <p>
                    <strong>通知設定:</strong>{" "}
                    予約 {item.canViewReservations ? "ON" : "OFF"} / ノート {item.canViewLessonNotes ? "ON" : "OFF"} / お知らせ{" "}
                    {item.canReceiveNotifications ? "ON" : "OFF"}
                  </p>
                </article>
              ))}
            {parentLinks.filter((item) => item.status === "active").length === 0 ? (
              <p className={adminStyles.smallMuted}>連携中の保護者がありません。</p>
            ) : null}
          </div>

          <h4 className={detailStyles.blockTitle}>保護者連携操作</h4>
          <div className={detailStyles.formGrid}>
            <label className={styles.label}>
              保護者操作
              <select className={styles.field} value={parentAction} onChange={(e) => setParentAction(e.target.value)}>
                <option value="none">変更なし</option>
                <option value="link">保護者を連携</option>
                <option value="update">保護者権限を更新</option>
                <option value="reset_password">保護者パスワード初期化</option>
                <option value="unlink">保護者連携を解除</option>
              </select>
            </label>

            {parentAction === "update" || parentAction === "reset_password" ? (
              <label className={styles.label}>
                {parentAction === "reset_password" ? "初期化対象" : "更新対象"}
                <select className={styles.field} value={parentLinkId} onChange={(e) => setParentLinkId(e.target.value)}>
                  <option value="">選択してください</option>
                  {parentLinks
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.parentDisplayName || item.parentEmail || "-"} ({item.parentEmail || "-"})
                      </option>
                    ))}
                </select>
              </label>
            ) : null}

            {parentAction === "unlink" ? (
              <label className={styles.label}>
                解除対象
                <select className={styles.field} value={parentLinkId} onChange={(e) => setParentLinkId(e.target.value)}>
                  <option value="">選択してください</option>
                  {parentLinks
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.parentDisplayName || item.parentEmail || "-"} ({item.parentEmail || "-"})
                      </option>
                    ))}
                </select>
              </label>
            ) : null}

            {parentAction === "link" || parentAction === "update" ? (
              <>
                <label className={styles.label}>
                  保護者メール
                  <input
                    className={styles.field}
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    disabled={parentAction !== "link"}
                  />
                </label>
                <label className={styles.label}>
                  保護者電話
                  <input
                    className={styles.field}
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="080-1234-5678"
                  />
                </label>
                <label className={styles.label}>
                  続柄
                  <input
                    className={styles.field}
                    value={parentRelationship}
                    onChange={(e) => setParentRelationship(e.target.value)}
                    placeholder="母 / 父 / 保護者"
                  />
                </label>
                <label className={styles.label}>
                  Primary
                  <select className={styles.field} value={parentIsPrimary ? "yes" : "no"} onChange={(e) => setParentIsPrimary(e.target.value === "yes")}>
                    <option value="no">no</option>
                    <option value="yes">yes</option>
                  </select>
                </label>
                <label className={styles.label}>
                  予約通知
                  <select
                    className={styles.field}
                    value={parentCanViewReservations ? "yes" : "no"}
                    onChange={(e) => setParentCanViewReservations(e.target.value === "yes")}
                  >
                    <option value="yes">yes</option>
                    <option value="no">no</option>
                  </select>
                </label>
                <label className={styles.label}>
                  レッスンノート通知
                  <select
                    className={styles.field}
                    value={parentCanViewLessonNotes ? "yes" : "no"}
                    onChange={(e) => setParentCanViewLessonNotes(e.target.value === "yes")}
                  >
                    <option value="yes">yes</option>
                    <option value="no">no</option>
                  </select>
                </label>
                <label className={styles.label}>
                  宿題表示
                  <select
                    className={styles.field}
                    value={parentCanViewHomework ? "yes" : "no"}
                    onChange={(e) => setParentCanViewHomework(e.target.value === "yes")}
                  >
                    <option value="yes">yes</option>
                    <option value="no">no</option>
                  </select>
                </label>
                <label className={styles.label}>
                  決済表示
                  <select
                    className={styles.field}
                    value={parentCanViewPayments ? "yes" : "no"}
                    onChange={(e) => setParentCanViewPayments(e.target.value === "yes")}
                  >
                    <option value="yes">yes</option>
                    <option value="no">no</option>
                  </select>
                </label>
                <label className={styles.label}>
                  お知らせ通知
                  <select
                    className={styles.field}
                    value={parentCanReceiveNotifications ? "yes" : "no"}
                    onChange={(e) => setParentCanReceiveNotifications(e.target.value === "yes")}
                  >
                    <option value="yes">yes</option>
                    <option value="no">no</option>
                  </select>
                </label>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "lesson-time" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>レッスン時間の運営</h3>
          <p className={adminStyles.smallMuted}>
            受講完了時の自動消費は予約の「完了」処理で行われます。ここでの減算は<strong>手動での調整</strong>です（残りを超える分は自動でキャップされます）。
          </p>
          {Number(lessonMinutes?.remainingMinutes ?? 0) <= 0 ? (
            <p className={`${styles.message} ${styles.messageError}`} style={{ marginBottom: "0.65rem" }}>
              残り時間が0以下です。受講前に時間付与をご確認ください。
            </p>
          ) : null}
          {Number(lessonMinutes?.remainingMinutes ?? 0) > 0 &&
          Number(lessonMinutes?.remainingMinutes ?? 0) <= 180 ? (
            <p className={`${styles.message}`} style={{ marginBottom: "0.65rem", borderColor: "#f6e2b3" }}>
              残り時間が180分以下です。継続受講の案内を検討してください。
            </p>
          ) : null}
          {adminLessonMinutesPreview.completionHintJa ? (
            <p
              className={
                adminLessonMinutesPreview.nextCompletionInsufficient
                  ? `${styles.message} ${styles.messageError}`
                  : styles.description
              }
              style={{ marginBottom: "0.65rem" }}
            >
              {adminLessonMinutesPreview.completionHintJa}
            </p>
          ) : null}
          {adminLessonMinutesPreview.projectedRemainingHintJa ? (
            <p className={styles.description} style={{ marginBottom: "0.65rem" }}>
              {adminLessonMinutesPreview.projectedRemainingHintJa}
            </p>
          ) : null}
          <div className={styles.message}>
            <p>総保有時間: {lessonMinutes?.totalMinutes ?? "-"}分</p>
            <p>使用時間: {lessonMinutes?.usedMinutes ?? "-"}分</p>
            <p>残り時間: {lessonMinutes?.remainingMinutes ?? "-"}分</p>
            {lessonMinuteJournalSummary ? (
              <p className={adminStyles.smallMuted} style={{ marginTop: "0.5rem" }}>
                原簿集計（参考）: 付与計 {lessonMinuteJournalSummary.chargeSum ?? 0} / 消費計{" "}
                {lessonMinuteJournalSummary.usageSum ?? 0} / 手動計 {lessonMinuteJournalSummary.manualSum ?? 0} →
                残り {lessonMinuteJournalSummary.remainingMinutes ?? 0}
              </p>
            ) : null}
          </div>

          <div className={detailStyles.lessonMinutesTools}>
            <article className={detailStyles.lessonMinutesToolCard}>
              <h4 className={detailStyles.blockTitle}>時間を追加</h4>
              <p className={adminStyles.smallMuted} style={{ marginBottom: "0.5rem" }}>
                よく使う分数はワンタップで入力できます。メモを書いてから「レッスン時間のみ反映」で確定してください。
              </p>
              <div className={detailStyles.lessonMinutePresetRow}>
                <span className={adminStyles.smallMuted}>クイック:</span>
                {LESSON_MINUTE_QUICK_ADD_MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={detailStyles.lessonMinutePresetBtn}
                    onClick={() => {
                      setLessonMinutesCreditPackageId("");
                      setLessonMinutesCreditMinutes(String(m));
                    }}
                  >
                    +{m}分
                  </button>
                ))}
              </div>
              <div className={detailStyles.formGrid}>
                <label className={styles.label}>
                  時間追加商品 (選択)
                  <select
                    className={styles.field}
                    value={lessonMinutesCreditPackageId}
                    onChange={(e) => {
                      const packageId = e.target.value;
                      setLessonMinutesCreditPackageId(packageId);
                      const selected = activeLessonMinutePackages.find((pkg) => pkg.id === packageId);
                      if (selected) setLessonMinutesCreditMinutes(String(selected.minutes));
                    }}
                  >
                    <option value="">直接入力を使用</option>
                    {activeLessonMinutePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.minutes}分)
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  追加する分数（+）
                  <input
                    className={styles.field}
                    type="number"
                    min="0"
                    value={lessonMinutesCreditMinutes}
                    onChange={(e) => setLessonMinutesCreditMinutes(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  種別
                  <select className={styles.field} value={lessonMinutesCreditType} onChange={(e) => setLessonMinutesCreditType(e.target.value)}>
                    <option value="purchase">purchase（購入）</option>
                    <option value="admin_grant">admin_grant（管理者付与）</option>
                    <option value="manual_adjustment">manual_adjustment（手動補正）</option>
                  </select>
                </label>
                <label className={styles.label}>
                  メモ（理由）※必須
                  <input
                    className={styles.field}
                    value={lessonMinutesCreditReason}
                    onChange={(e) => setLessonMinutesCreditReason(e.target.value)}
                    placeholder="例: 5月パッケージ購入"
                  />
                </label>
              </div>
            </article>

            <article className={detailStyles.lessonMinutesToolCard}>
              <h4 className={detailStyles.blockTitle}>時間を減算（手動）</h4>
              <p className={adminStyles.smallMuted}>予約完了とは別枠の調整用です。入力した分だけ残りから減じます（残り超過分はキャップ）。</p>
              <div className={detailStyles.formGrid}>
                <label className={styles.label}>
                  減算する分数
                  <input
                    className={styles.field}
                    type="number"
                    min="0"
                    value={lessonMinutesDeductMinutes}
                    onChange={(e) => setLessonMinutesDeductMinutes(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  メモ（理由）※必須
                  <input
                    className={styles.field}
                    value={lessonMinutesDeductMemo}
                    onChange={(e) => setLessonMinutesDeductMemo(e.target.value)}
                    placeholder="例: 誤付与の訂正"
                  />
                </label>
              </div>
            </article>

            <article className={detailStyles.lessonMinutesToolCard}>
              <h4 className={detailStyles.blockTitle}>手動で増減（まとめて記録）</h4>
              <p className={adminStyles.smallMuted}>正の数で加算、負の数で減算。細かな補正に使います。</p>
              <div className={detailStyles.formGrid}>
                <label className={styles.label}>
                  調整分数（+/-）
                  <input
                    className={styles.field}
                    type="number"
                    value={lessonMinutesAdjustMinutes}
                    onChange={(e) => setLessonMinutesAdjustMinutes(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  理由※必須（0以外のとき）
                  <input
                    className={styles.field}
                    value={lessonMinutesAdjustReason}
                    onChange={(e) => setLessonMinutesAdjustReason(e.target.value)}
                    placeholder="例: システム移行調整"
                  />
                </label>
              </div>
            </article>
          </div>

          <div className={detailStyles.lessonMinutesApplyRow}>
            <button
              type="button"
              className={styles.button}
              disabled={lessonMinutesApplyLoading}
              onClick={handleLessonMinutesApply}
            >
              {lessonMinutesApplyLoading ? "反映中..." : "レッスン時間のみ反映"}
            </button>
            <p className={adminStyles.smallMuted}>
              二重送信防止のため、操作ごとに内部IDが付与されます。同じ内容を繰り返す場合は再度ボタンを押してください。
            </p>
          </div>

          <h4 className={detailStyles.blockTitle}>公式時間原簿（レッスン分・種別別）</h4>
          <p className={adminStyles.smallMuted}>
            charge=付与・購入 / usage=受講完了時の消費 / manual_adjustment=手動・返却など。
          </p>

          <h5 className={detailStyles.blockTitle}>最近の付与（charge）</h5>
          <div className={detailStyles.stackList}>
            {lessonMinuteJournalCharges.map((row) => (
              <article key={row.id} className={detailStyles.itemCard}>
                <p>
                  <strong>日時:</strong> {formatDateTime(row.createdAt)}
                </p>
                <p>
                  <strong>種別:</strong> {lessonMinuteJournalTypeLabelJa(row.type)} ({row.type || "-"})
                </p>
                <p>
                  <strong>分:</strong> {row.minutes ?? 0}
                </p>
                {row.relatedReservationId ? (
                  <p>
                    <strong>予約ID:</strong> {row.relatedReservationId}
                  </p>
                ) : null}
                <p>
                  <strong>メモ:</strong> {row.memo || "-"}
                </p>
                <p>
                  <strong>処理者:</strong> {row.createdByRole || "-"}
                </p>
              </article>
            ))}
            {lessonMinuteJournalCharges.length === 0 ? (
              <p className={adminStyles.smallMuted}>付与原簿がありません。</p>
            ) : null}
          </div>

          <h5 className={detailStyles.blockTitle}>最近の消費（usage）</h5>
          <div className={detailStyles.stackList}>
            {lessonMinuteJournalUsage.map((row) => (
              <article key={row.id} className={detailStyles.itemCard}>
                <p>
                  <strong>日時:</strong> {formatDateTime(row.createdAt)}
                </p>
                <p>
                  <strong>種別:</strong> {lessonMinuteJournalTypeLabelJa(row.type)} ({row.type || "-"})
                </p>
                <p>
                  <strong>分:</strong> {row.minutes ?? 0}
                </p>
                {row.relatedReservationId ? (
                  <p>
                    <strong>予約ID:</strong> {row.relatedReservationId}
                  </p>
                ) : null}
                <p>
                  <strong>メモ:</strong> {row.memo || "-"}
                </p>
                <p>
                  <strong>処理者:</strong> {row.createdByRole || "-"}
                </p>
              </article>
            ))}
            {lessonMinuteJournalUsage.length === 0 ? (
              <p className={adminStyles.smallMuted}>消費原簿がありません。</p>
            ) : null}
          </div>

          <h5 className={detailStyles.blockTitle}>最近の手動調整（manual_adjustment）</h5>
          <div className={detailStyles.stackList}>
            {lessonMinuteJournalManual.map((row) => (
              <article key={row.id} className={detailStyles.itemCard}>
                <p>
                  <strong>日時:</strong> {formatDateTime(row.createdAt)}
                </p>
                <p>
                  <strong>種別:</strong> {lessonMinuteJournalTypeLabelJa(row.type)} ({row.type || "-"})
                </p>
                <p>
                  <strong>分（符号付き）:</strong> {row.minutes ?? 0}
                </p>
                {row.relatedReservationId ? (
                  <p>
                    <strong>予約ID:</strong> {row.relatedReservationId}
                  </p>
                ) : null}
                <p>
                  <strong>メモ:</strong> {row.memo || "-"}
                </p>
                <p>
                  <strong>処理者:</strong> {row.createdByRole || "-"}
                </p>
              </article>
            ))}
            {lessonMinuteJournalManual.length === 0 ? (
              <p className={adminStyles.smallMuted}>手動調整原簿がありません。</p>
            ) : null}
          </div>

          <h4 className={detailStyles.blockTitle}>授業時間履歴（ログ）</h4>
          <div className={detailStyles.stackList}>
            {lessonMinuteLogs.map((log) => (
              <article key={log.id} className={detailStyles.itemCard}>
                <p><strong>日時:</strong> {formatDateTime(log.at)}</p>
                <p><strong>タイプ:</strong> {log.type || "-"}</p>
                <p><strong>分:</strong> {log.minutes ?? 0}</p>
                <p><strong>理由:</strong> {log.reason || "-"}</p>
                <p><strong>処理者:</strong> {log.actorRole || "-"}</p>
                <p>
                  <strong>残時間:</strong> {log.beforeRemainingMinutes ?? "-"} → {log.afterRemainingMinutes ?? "-"}
                </p>
              </article>
            ))}
            {lessonMinuteLogs.length === 0 ? <p className={adminStyles.smallMuted}>時間履歴がありません。</p> : null}
          </div>

          <h4 className={detailStyles.blockTitle}>レガシー内部原簿（lessonMinuteLedger・互換）</h4>
          <p className={adminStyles.smallMuted}>
            topup=付与 / usage=受講完了時の消費 / refund=返却 / manual=手動。
          </p>
          <div className={detailStyles.stackList}>
            {lessonMinuteLedger.map((row) => (
              <article key={row.id} className={detailStyles.itemCard}>
                <p>
                  <strong>日時:</strong> {formatDateTime(row.at)}
                </p>
                <p>
                  <strong>種別:</strong> {lessonMinuteLedgerKindLabelJa(row.kind)} ({row.kind || "-"})
                </p>
                <p>
                  <strong>増減(残り基準):</strong> {row.minutesDelta > 0 ? "+" : ""}
                  {row.minutesDelta ?? 0} 分
                </p>
                <p>
                  <strong>処理後の残り:</strong> {row.balanceAfterRemaining ?? "-"} 分
                </p>
                {row.reservationId ? (
                  <p>
                    <strong>予約ID:</strong> {row.reservationId}
                  </p>
                ) : null}
                <p>
                  <strong>メモ:</strong> {row.reason || "-"}
                </p>
              </article>
            ))}
            {lessonMinuteLedger.length === 0 ? (
              <p className={adminStyles.smallMuted}>原簿エントリがありません（保存データ読込後に表示されます）。</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "notices" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>お知らせ履歴</h3>
          <p className={adminStyles.smallMuted}>学生ポータル表示履歴 + 実際の通知メール送信履歴を確認します。</p>
          <div className={detailStyles.stackList}>
            {notices.map((notice) => (
              <article key={notice.id} className={detailStyles.itemCard}>
                <p><strong>タイトル:</strong> {notice.title || "-"}</p>
                <p><strong>送信日:</strong> {formatDateTime(notice.publishedAt || notice.updatedAt)}</p>
                <p><strong>種別:</strong> {notice.isImportant ? "教室からのお知らせ(重要)" : "教室からのお知らせ"}</p>
                <p><strong>既読状況:</strong> 既読管理は次段階</p>
              </article>
            ))}
            {notices.length === 0 ? <p className={adminStyles.smallMuted}>表示できるお知らせがありません。</p> : null}
          </div>

          <h4 className={detailStyles.blockTitle}>通知送信履歴 (配信記録)</h4>
          {notificationLoading ? <p className={adminStyles.smallMuted}>通知履歴を読み込み中...</p> : null}
          <div className={detailStyles.stackList}>
            {notificationLogs.map((log) => (
              <article key={log.id} className={detailStyles.itemCard}>
                <p><strong>送信日:</strong> {formatDateTime(log.createdAt)}</p>
                <p><strong>宛先:</strong> {log.toEmail || "-"}</p>
                <p><strong>種別:</strong> {log.type || "-"}</p>
                <p><strong>件名:</strong> {log.subject || "-"}</p>
                <p><strong>状態:</strong> {log.status || "-"}</p>
              </article>
            ))}
            {!notificationLoading && notificationLogs.length === 0 ? (
              <p className={adminStyles.smallMuted}>通知送信履歴がありません。</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "memo" ? (
        <section className={detailStyles.sectionCard}>
          <h3 className={detailStyles.sectionTitle}>管理メモ</h3>
          <div className={detailStyles.formGrid}>
            <label className={styles.label}>
              学生の性向
              <input className={styles.field} value={adminStudentTendency} onChange={(e) => setAdminStudentTendency(e.target.value)} />
            </label>
            <label className={styles.label}>
              授業時の注意事項
              <input className={styles.field} value={adminLessonCautions} onChange={(e) => setAdminLessonCautions(e.target.value)} />
            </label>
            <label className={styles.label}>
              反応スタイル
              <input className={styles.field} value={adminResponseStyle} onChange={(e) => setAdminResponseStyle(e.target.value)} />
            </label>
            <label className={styles.label}>
              学習特徴
              <input className={styles.field} value={adminLearningTraits} onChange={(e) => setAdminLearningTraits(e.target.value)} />
            </label>
            <label className={styles.label}>
              相談メモ
              <input className={styles.field} value={adminCounselMemo} onChange={(e) => setAdminCounselMemo(e.target.value)} />
            </label>
          </div>

          <p className={adminStyles.smallMuted}>
            レッスン時間の<strong>付与・減算・履歴・原簿</strong>は「レッスン時間」タブから操作してください。時間の更新は「レッスン時間のみ反映」ボタンで行い、ページ下部の保存とは分離されています（二重送信防止）。
          </p>

          <h4 className={detailStyles.blockTitle}>ペア履歴</h4>
          <div className={detailStyles.stackList}>
            {pairHistory.map((item) => (
              <article key={item.id} className={detailStyles.itemCard}>
                <p><strong>状態:</strong> {item.status === "active" ? "有効" : "解除済み"}</p>
                <p><strong>開始:</strong> {formatDateTime(item.startedAt)}</p>
                <p><strong>解除:</strong> {formatDateTime(item.endedAt)}</p>
                <p><strong>相手:</strong> {item.partner?.nameKanji || "-"} ({item.partner?.studentNumber || "-"})</p>
              </article>
            ))}
            {pairHistory.length === 0 ? <p className={adminStyles.smallMuted}>ペア履歴がありません。</p> : null}
          </div>
        </section>
      ) : null}

      <div className={detailStyles.bottomBar}>
        <button className={styles.button} type="submit" disabled={isSaving}>
          {isSaving ? "保存中..." : "保存"}
        </button>
      </div>
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>
          {status.text}
        </p>
      ) : null}
    </form>
  );
}

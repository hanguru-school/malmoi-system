import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import * as PaymentEngine from "../payments/engine.js";
import {
  buildLessonMinutesCompletionPreview,
  formatLessonMinuteJournalEntryForStudentPortal,
  summarizeLessonMinuteJournalEntries,
} from "../adapters/lessonMinutesSummary.js";
import { registrationConsentPathWithDefaultUi, verifyLinkUiQuerySuffix } from "../student/registrationNavPaths.js";
import { sumReservedMinutesFromReservations } from "../student/reservationMinutesShared.js";
import { pointsForMinutes } from "../operational/pointsPolicy.js";
import { getClassroomDaySchedule } from "../reservations/classroomSchedule.js";
import { buildClassroomWeekPortalRows } from "../reservations/classroomPortalSummary.js";
import {
  evaluateAdminBookingSlot,
  findLessonServiceFromStore,
} from "../reservations/adminSlotEvaluation.js";
import { normalizeLessonServiceCatalogEntry } from "../reservations/lessonServiceModel.js";
import { lessonInsideWorkWindow, lessonOverlapsBreak } from "../reservations/timeMath.js";
import { addDaysYmd } from "../admin/reservationCalendarModel.js";
import { buildReservationCandidates } from "../reservations/engine/reservationCandidateEngine.js";
import { ReasonCodes } from "../reservations/engine/reasonCodes.js";
import {
  applyReservationPointCharge,
  applyReservationPointRefundOnCancel,
  applyReservationPointRescheduleDelta,
  resolveReservationPointCost,
} from "../reservations/reservationPointBilling.js";

const DEFAULT_AUTH_STORE_PATH = path.join(process.cwd(), ".data", "auth-store.json");
const LOGIN_TOKEN_TTL_MINUTES = Number(process.env.AUTH_TOKEN_TTL_MINUTES || 15);
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(process.env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);
/** 管理者セルフサービス用（学生用トークンとは別配列で管理） */
const ADMIN_PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(process.env.AUTH_ADMIN_PASSWORD_RESET_TOKEN_TTL_MINUTES || 60);
const ADMIN_PWD_RESET_RATE_WINDOW_MS = 60 * 60 * 1000;
const ADMIN_PWD_RESET_MAX_PER_IP = 10;
const ADMIN_PWD_RESET_MAX_PER_EMAIL = 5;
const SESSION_TTL_HOURS = Number(process.env.AUTH_SESSION_TTL_HOURS || 24 * 7);
const AUDIT_LOG_LIMIT = Number(process.env.AUTH_AUDIT_LOG_LIMIT || 2000);
const MAIL_LOG_LIMIT = Number(process.env.AUTH_MAIL_LOG_LIMIT || 3000);
const STUDENT_CHANGE_CUTOFF_MINUTES = Number(
  process.env.RESERVATION_STUDENT_CHANGE_CUTOFF_MINUTES || 180
);
const STUDENT_CANCEL_CUTOFF_MINUTES = Number(
  process.env.RESERVATION_STUDENT_CANCEL_CUTOFF_MINUTES || 180
);
const RESERVATION_STUDENT_BOOKABLE_DAYS = Number(
  process.env.RESERVATION_STUDENT_BOOKABLE_DAYS || 365
);
const STUDENT_INITIAL_TOTAL_MINUTES = 0;
/** 管理画面から1回のPATCHで付与・減算・手動調整に使える分の上限（既定7日×1440分） */
const LESSON_MINUTES_ADMIN_MAX_ABS_DELTA = Math.min(
  50000,
  Math.max(60, Number(process.env.LESSON_MINUTES_ADMIN_MAX_ABS_DELTA || 10080))
);
const LESSON_MINUTES_DEDUCT_ON_NO_SHOW =
  String(process.env.LESSON_MINUTES_DEDUCT_ON_NO_SHOW || "false").toLowerCase() === "true";
const LESSON_MINUTES_REFUND_ON_STUDENT_CANCEL =
  String(process.env.LESSON_MINUTES_REFUND_ON_STUDENT_CANCEL || "true").toLowerCase() === "true";
const LESSON_MINUTES_REFUND_ON_ADMIN_CANCEL =
  String(process.env.LESSON_MINUTES_REFUND_ON_ADMIN_CANCEL || "true").toLowerCase() === "true";
/** true（既定）: 授業時間の消費は予約ステータス「完了」への遷移時のみ。false かつ下記レガシー true で従来の出欠ベースに戻せる */
const LESSON_MINUTES_DEDUCT_ON_COMPLETION_ONLY =
  String(process.env.LESSON_MINUTES_DEDUCT_ON_COMPLETION_ONLY ?? "true").toLowerCase() !== "false";
const LESSON_MINUTES_DEDUCT_ON_ATTENDED_LEGACY =
  String(process.env.LESSON_MINUTES_DEDUCT_ON_ATTENDED_LEGACY || "false").toLowerCase() === "true";
const PRIMARY_SUPER_ADMIN = {
  displayName: "朱　勇進",
  nameFurigana: "ジュ　ヨンジン",
  email: "office@hanguru.school",
  phone: "080-5765-9419",
  role: "admin",
  adminRank: "SUPER_ADMIN",
  initialPassword: "9419",
};

let queue = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "")
    .replace(/[^0-9+]/g, "")
    .trim();
}

/** 学生氏名の照合用（全角/半角スペースの差で不一致にならないようにする） */
function normalizeNameKanjiForMatch(name) {
  return String(name || "")
    .trim()
    .replace(/[\u3000\u00A0\s]+/g, "");
}

function normalizeDate(date) {
  const raw = String(date || "").trim();
  if (!raw) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function normalizeStudentNumber(value) {
  return String(value || "").trim().toUpperCase();
}

function hashPassword(rawPassword) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(rawPassword || ""), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(rawPassword, storedHash) {
  const value = String(storedHash || "").trim();
  if (!value.startsWith("scrypt:")) return false;
  const [, salt, hash] = value.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(rawPassword || ""), salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

function extractLast4DigitsFromPhone(phone) {
  const normalized = normalizePhone(phone);
  const digitsOnly = normalized.replace(/\D/g, "");
  if (digitsOnly.length < 4) return null;
  return digitsOnly.slice(-4);
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function newId() {
  return crypto.randomUUID();
}

function randomStudentCodePart() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(6);
  let result = "";
  for (let i = 0; i < 6; i += 1) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

function isValidStudentNumber(value) {
  return /^MM-[A-Z0-9]{6}$/.test(String(value || "").trim());
}

function generateUniqueStudentNumber(store) {
  let candidate = "";
  do {
    candidate = `MM-${randomStudentCodePart()}`;
  } while (store.students.some((student) => String(student.studentNumber || "").trim() === candidate));
  return candidate;
}

function assignStudentNumberIfNeeded(store, student, options = {}) {
  const onlyWhenCompleted = options.onlyWhenCompleted !== false;
  if (onlyWhenCompleted && String(student.registrationStatus || "") !== "completed") return false;

  const current = String(student.studentNumber || "").trim();
  const duplicated =
    current &&
    store.students.some(
      (item) => item.id !== student.id && String(item.studentNumber || "").trim() === current
    );
  const needsNew = !isValidStudentNumber(current) || duplicated;
  if (!needsNew) return false;

  student.studentNumber = generateUniqueStudentNumber(store);
  return true;
}

function authStorePath() {
  return process.env.AUTH_STORE_PATH || DEFAULT_AUTH_STORE_PATH;
}

/** 管理用: 永続化ファイルの絶対パス（診断API・スクリプト用） */
export function getAuthStoreAbsolutePath() {
  const raw = authStorePath();
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function emptyStore() {
  const ts = nowIso();
  return {
    version: 9,
    users: [],
    loginTokens: [],
    passwordResetTokens: [],
    adminPasswordResetTokens: [],
    adminPasswordResetRateLog: [],
    sessions: [],
    students: [],
    studentPairs: [],
    studentParents: [],
    userStudentLinks: [],
    auditLogs: [],
    mailLogs: [],
    mailTemplateSettings: [],
    systemSettings: null,
    systemSettingLogs: [],
    lessonMinuteLogs: [],
    lessonMinuteLedger: [],
    lessonMinuteJournal: [],
    lessonMinutePackages: [],
    lessonNotes: [],
    lessonNoteStudents: [],
    homeworks: [],
    homeworkTemplates: [],
    pointConversionRules: [],
    pointTimeConversionRules: [],
    reservationPolicy: null,
    notices: [],
    reservations: [],
    reservationSlots: [],
    paymentGlobalRule: {
      taxRatePercent: 10,
      bonusTiers: [],
      updatedAt: ts,
    },
    paymentRuleTemplates: [],
    paymentStudentAssignments: [],
    paymentRuleHistory: [],
    paymentTransactions: [],
    paymentCompletionLogs: [],
    paymentEvents: [],
    processedLessonMinuteOpIds: [],
    roleInvitations: [],
    teacherAvailabilityProfiles: [],
    pointLedgers: [],
  };
}

async function ensureStoreFile() {
  const filePath = authStorePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

function migrateStudentShape(student) {
  if (!student.crmProfile) {
    student.crmProfile = {
      addressLine1: String(student.address || "").trim(),
      addressLine2: "",
      postalCode: "",
      birthDate: normalizeDate(student.birthDate || ""),
      phoneMobile: normalizePhone(student.phone || ""),
      phoneEmergency: "",
      emergencyContactName: "",
      emergencyContactNameFurigana: "",
      emergencyContactRelation: "",
      nameKorean: "",
      profileImageDataUrl: "",
      adminStudentTendency: "",
      adminLessonCautions: "",
      adminResponseStyle: "",
      adminLearningTraits: "",
      adminCounselMemo: "",
      notes: String(student.extraInfo || "").trim(),
    };
  }
  if (!("emergencyContactName" in student.crmProfile)) student.crmProfile.emergencyContactName = "";
  if (!("emergencyContactNameFurigana" in student.crmProfile)) student.crmProfile.emergencyContactNameFurigana = "";
  if (!("emergencyContactRelation" in student.crmProfile)) student.crmProfile.emergencyContactRelation = "";
  if (!("nameKorean" in student.crmProfile)) student.crmProfile.nameKorean = "";
  if (!("profileImageDataUrl" in student.crmProfile)) student.crmProfile.profileImageDataUrl = "";
  if (!("adminStudentTendency" in student.crmProfile)) student.crmProfile.adminStudentTendency = "";
  if (!("adminLessonCautions" in student.crmProfile)) student.crmProfile.adminLessonCautions = "";
  if (!("adminResponseStyle" in student.crmProfile)) student.crmProfile.adminResponseStyle = "";
  if (!("adminLearningTraits" in student.crmProfile)) student.crmProfile.adminLearningTraits = "";
  if (!("adminCounselMemo" in student.crmProfile)) student.crmProfile.adminCounselMemo = "";

  // Backward-compatible projections for existing pages.
  student.address = student.crmProfile.addressLine1 || "";
  student.birthDate = student.crmProfile.birthDate || "";
  student.phone = student.crmProfile.phoneMobile || "";
  student.extraInfo = student.crmProfile.notes || "";

  const fallbackTotal = 0;
  const rawTotal = Number(student?.lessonMinutes?.totalMinutes ?? student?.lessonMinutesTotal ?? fallbackTotal);
  const rawUsed = Number(student?.lessonMinutes?.usedMinutes ?? student?.lessonMinutesUsed ?? 0);
  const totalMinutes = Math.max(0, Number.isFinite(rawTotal) ? rawTotal : fallbackTotal);
  const usedMinutes = Math.max(0, Number.isFinite(rawUsed) ? rawUsed : 0);
  const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
  student.lessonMinutes = {
    totalMinutes,
    usedMinutes,
    remainingMinutes,
    updatedAt: student?.lessonMinutes?.updatedAt || student.updatedAt || student.createdAt || nowIso(),
  };
  student.points = {
    balance: Number(student?.points?.balance ?? student?.pointsBalance ?? 0),
    totalPurchasedPoints: Math.max(0, Number(student?.points?.totalPurchasedPoints ?? 0)),
    totalUsedPoints: Math.max(0, Number(student?.points?.totalUsedPoints ?? 0)),
    updatedAt: student?.points?.updatedAt || student.updatedAt || student.createdAt || nowIso(),
  };
  student.studentNumber = String(student.studentNumber || "").trim() || null;
  student.phoneNormalized = normalizePhone(student.crmProfile.phoneMobile || student.phone || "");
  student.isMinor = Boolean(student.isMinor);
  student.guardianRequired = Boolean(student.guardianRequired);
  student.guardianMemo = String(student.guardianMemo || "").trim();
}

function migrateUserShape(user) {
  user.email = normalizeEmail(user.email);
  user.displayName = String(user.displayName || displayNameFromEmail(user.email)).trim();
  user.role = String(user.role || "student").trim() || "student";
  if (user.role === "SUPER_ADMIN" || user.role === "super_admin") user.role = "admin";
  user.nameFurigana = String(user.nameFurigana || "").trim();
  user.phone = String(user.phone || "").trim();
  user.phoneNormalized = normalizePhone(user.phoneNormalized || user.phone);
  user.adminRank = String(user.adminRank || "").trim();
  user.status = String(user.status || "active").trim() || "active";
  user.passwordHash = String(user.passwordHash || "").trim() || null;
  user.mustChangePassword = Boolean(user.mustChangePassword);
  user.failedLoginCount = Math.max(0, Number(user.failedLoginCount || 0));
  user.lockedUntil = String(user.lockedUntil || "").trim() || null;
  if (!user.createdAt) user.createdAt = nowIso();
  if (!user.updatedAt) user.updatedAt = user.createdAt;
  if (!("lastLoginAt" in user)) user.lastLoginAt = null;
  if (!("profileImageDataUrl" in user)) user.profileImageDataUrl = "";
  if (!("jobTitle" in user)) user.jobTitle = "";
  if (!("signatureNote" in user)) user.signatureNote = "";
}

function migrateMailLogShape(log) {
  log.id = String(log.id || newId()).trim();
  log.type = String(log.type || "unknown").trim() || "unknown";
  log.toEmail = normalizeEmail(log.toEmail || "");
  log.recipientEmail = normalizeEmail(log.recipientEmail || log.toEmail || "");
  log.recipientName = String(log.recipientName || "").trim() || null;
  log.recipientRole = String(log.recipientRole || "").trim() || null;
  log.subject = String(log.subject || "").trim();
  log.status = String(log.status || "unknown").trim() || "unknown";
  log.mode = String(log.mode || "").trim() || null;
  log.messageId = String(log.messageId || "").trim() || null;
  log.error = String(log.error || "").trim() || null;
  log.errorMessage = String(log.errorMessage || log.error || "").trim() || null;
  log.linkUrl = String(log.linkUrl || "").trim() || null;
  log.templateName = String(log.templateName || "").trim() || null;
  log.sentAt = String(log.sentAt || "").trim() || null;
  log.failedAt = String(log.failedAt || "").trim() || null;
  log.bodyPreviewText = String(log.bodyPreviewText || "").trim() || null;
  log.bodyPreviewHtml = String(log.bodyPreviewHtml || "").trim() || null;
  log.relatedStudentId = String(log.relatedStudentId || "").trim() || null;
  log.relatedParentId = String(log.relatedParentId || "").trim() || null;
  log.relatedReservationId = String(log.relatedReservationId || "").trim() || null;
  log.relatedLessonNoteId = String(log.relatedLessonNoteId || "").trim() || null;
  log.relatedNoticeId = String(log.relatedNoticeId || "").trim() || null;
  log.resentFromLogId = String(log.resentFromLogId || "").trim() || null;
  log.meta = typeof log.meta === "object" && log.meta ? log.meta : {};
  if (!log.createdAt) log.createdAt = nowIso();
  if (!log.updatedAt) log.updatedAt = log.createdAt;
}

function migrateMailTemplateSettingShape(item) {
  item.type = String(item.type || "").trim();
  item.isActive = item.isActive !== false;
  if (!item.createdAt) item.createdAt = nowIso();
  if (!item.updatedAt) item.updatedAt = item.createdAt;
  item.updatedByUserId = String(item.updatedByUserId || "").trim() || null;
}

function hasLessonMinuteHistory(store, studentId) {
  return store.lessonMinuteLogs.some((log) => log.studentId === studentId);
}

function shouldResetLegacyInitialMinutes(store, student) {
  const pointsBalance = Number(student?.points?.balance || 0);
  const total = Number(student?.lessonMinutes?.totalMinutes || 0);
  const used = Number(student?.lessonMinutes?.usedMinutes || 0);
  const remaining = Number(student?.lessonMinutes?.remainingMinutes || 0);
  if (pointsBalance !== 0) return false;
  if (total !== 600 || used !== 0 || remaining !== 600) return false;
  if (hasLessonMinuteHistory(store, student.id)) return false;
  return true;
}

function resetLegacyInitialMinutesIfNeeded(store, student) {
  if (!shouldResetLegacyInitialMinutes(store, student)) return;
  const ts = nowIso();
  student.lessonMinutes = {
    totalMinutes: 0,
    usedMinutes: 0,
    remainingMinutes: 0,
    updatedAt: ts,
  };
  if (!student.updatedAt) student.updatedAt = ts;
}

function migrateStudentPairShape(pair) {
  pair.studentAId = String(pair.studentAId || "").trim();
  pair.studentBId = String(pair.studentBId || "").trim();
  pair.status = String(pair.status || "active") === "released" ? "released" : "active";
  if (!pair.startedAt) pair.startedAt = pair.createdAt || nowIso();
  if (!pair.createdAt) pair.createdAt = pair.startedAt;
  if (!pair.updatedAt) pair.updatedAt = pair.createdAt;
  if (pair.status === "released" && !pair.endedAt) pair.endedAt = pair.updatedAt;
  if (pair.status === "active") pair.endedAt = null;
}

function findActivePairByStudentId(store, studentId) {
  return (
    store.studentPairs.find(
      (pair) => pair.status === "active" && (pair.studentAId === studentId || pair.studentBId === studentId)
    ) || null
  );
}

function findActivePairBetweenStudents(store, leftStudentId, rightStudentId) {
  return (
    store.studentPairs.find(
      (pair) =>
        pair.status === "active" &&
        ((pair.studentAId === leftStudentId && pair.studentBId === rightStudentId) ||
          (pair.studentAId === rightStudentId && pair.studentBId === leftStudentId))
    ) || null
  );
}

function resolvePairInfoForStudent(store, studentId) {
  if (getPairPolicySettings(store).pairLessonEnabled === false) return null;
  const pair = findActivePairByStudentId(store, studentId);
  if (!pair) return null;
  const partnerId = pair.studentAId === studentId ? pair.studentBId : pair.studentAId;
  const partner = store.students.find((item) => item.id === partnerId) || null;
  if (partner) migrateStudentShape(partner);
  return {
    pairId: pair.id,
    status: pair.status,
    startedAt: pair.startedAt || null,
    endedAt: pair.endedAt || null,
    partner: partner
      ? {
          id: partner.id,
          studentNumber: partner.studentNumber || null,
          nameKanji: partner.nameKanji || "",
          email: partner.email || "",
          phone: partner.phone || "",
        }
      : null,
  };
}

function releasePair(store, pair, actor = null) {
  if (!pair || pair.status !== "active") return;
  pair.status = "released";
  pair.endedAt = nowIso();
  pair.updatedAt = pair.endedAt;
  pair.updatedByUserId = actor?.userId || null;
}

function migrateStudentParentShape(link) {
  link.studentId = String(link.studentId || "").trim();
  link.parentUserId = String(link.parentUserId || "").trim();
  link.relationship = String(link.relationship || "保護者").trim() || "保護者";
  link.status = String(link.status || "active").trim() === "inactive" ? "inactive" : "active";
  if (!("isPrimary" in link)) link.isPrimary = false;
  if (!("canViewReservations" in link)) link.canViewReservations = true;
  if (!("canViewLessonNotes" in link)) link.canViewLessonNotes = true;
  if (!("canViewHomework" in link)) link.canViewHomework = true;
  if (!("canViewPayments" in link)) link.canViewPayments = true;
  if (!("canReceiveNotifications" in link)) link.canReceiveNotifications = true;
  if (!("notes" in link)) link.notes = "";
  if (!("linkedByUserId" in link)) link.linkedByUserId = null;
  if (!("unlinkedAt" in link)) link.unlinkedAt = null;
  if (!("unlinkedByUserId" in link)) link.unlinkedByUserId = null;
  if (!link.createdAt) link.createdAt = nowIso();
  if (!link.updatedAt) link.updatedAt = link.createdAt;
}

function migrateLessonNoteShape(note) {
  note.id = String(note.id || newId()).trim();
  note.lessonUnitId = String(note.lessonUnitId || "").trim();
  note.reservationSlotId = String(note.reservationSlotId || "").trim() || null;
  note.teacherUserId = String(note.teacherUserId || "").trim() || null;
  note.date = normalizeReservationDate(note.date || "") || String(note.date || "").trim() || "";
  note.title = String(note.title || "").trim();
  note.summary = String(note.summary || "").trim();
  note.content = String(note.content || "").trim();
  note.homeworkSummary = String(note.homeworkSummary || "").trim();
  note.nextLessonPlan = String(note.nextLessonPlan || "").trim();
  if (!("isSharedToStudents" in note)) note.isSharedToStudents = true;
  if (!note.createdAt) note.createdAt = nowIso();
  if (!note.updatedAt) note.updatedAt = note.createdAt;
}

function migrateLessonNoteStudentShape(link) {
  link.id = String(link.id || newId()).trim();
  link.lessonNoteId = String(link.lessonNoteId || "").trim();
  link.studentId = String(link.studentId || "").trim();
  link.reservationId = String(link.reservationId || "").trim() || null;
  if (!("isVisibleToStudent" in link)) link.isVisibleToStudent = true;
  link.studentPrivateMemo = String(link.studentPrivateMemo || "").trim();
  link.studentFeedbackSummary = String(link.studentFeedbackSummary || "").trim();
  if (!link.createdAt) link.createdAt = nowIso();
  if (!link.updatedAt) link.updatedAt = link.createdAt;
}

function normalizeHomeworkType(value) {
  const normalized = String(value || "").trim();
  const allowed = [
    "vocabulary",
    "grammar",
    "writing",
    "conversation",
    "pronunciation",
    "reading",
    "listening",
    "free",
  ];
  return allowed.includes(normalized) ? normalized : "free";
}

function normalizeHomeworkStatus(value) {
  const normalized = String(value || "").trim();
  const allowed = ["not_started", "in_progress", "submitted", "reviewed", "completed"];
  return allowed.includes(normalized) ? normalized : "not_started";
}

function migrateHomeworkShape(homework) {
  homework.id = String(homework.id || newId()).trim();
  homework.studentId = String(homework.studentId || "").trim();
  homework.lessonUnitId = String(homework.lessonUnitId || "").trim() || null;
  homework.reservationId = String(homework.reservationId || "").trim() || null;
  homework.lessonDate = normalizeReservationDate(homework.lessonDate || "") || null;
  homework.teacherUserId = String(homework.teacherUserId || "").trim() || null;
  homework.title = String(homework.title || "").trim() || "宿題";
  homework.description = String(homework.description || "").trim();
  homework.type = normalizeHomeworkType(homework.type);
  homework.status = normalizeHomeworkStatus(homework.status);
  homework.teacherMemo = String(homework.teacherMemo || "").trim();
  homework.studentMemo = String(homework.studentMemo || "").trim();
  homework.dueDate = normalizeReservationDate(homework.dueDate || "") || null;
  homework.isPublished = homework.isPublished !== false;
  homework.createdAt = String(homework.createdAt || nowIso());
  homework.updatedAt = String(homework.updatedAt || homework.createdAt);
  homework.submittedAt = homework.submittedAt ? String(homework.submittedAt) : null;
  homework.reviewedAt = homework.reviewedAt ? String(homework.reviewedAt) : null;
  homework.completedAt = homework.completedAt ? String(homework.completedAt) : null;
}

function migrateHomeworkTemplateShape(template) {
  template.id = String(template.id || newId()).trim();
  template.title = String(template.title || "").trim() || "宿題テンプレート";
  template.description = String(template.description || "").trim();
  template.type = normalizeHomeworkType(template.type);
  template.teacherMemo = String(template.teacherMemo || "").trim();
  template.createdByUserId = String(template.createdByUserId || "").trim() || null;
  template.updatedByUserId = String(template.updatedByUserId || "").trim() || null;
  if (!template.createdAt) template.createdAt = nowIso();
  if (!template.updatedAt) template.updatedAt = template.createdAt;
}

function listActiveParentLinksByUser(store, parentUserId) {
  return store.studentParents.filter(
    (link) => link.status === "active" && String(link.parentUserId || "") === String(parentUserId || "")
  );
}

function resolveParentLinksForStudent(store, studentId) {
  return store.studentParents
    .filter((link) => link.studentId === studentId)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .map((link) => {
      const parentUser = store.users.find((user) => user.id === link.parentUserId) || null;
      return {
        id: link.id,
        parentUserId: link.parentUserId,
        parentEmail: parentUser?.email || "",
        parentDisplayName: parentUser?.displayName || "",
        parentPhone: parentUser?.phone || "",
        relationship: link.relationship,
        status: link.status,
        isPrimary: Boolean(link.isPrimary),
        canViewReservations: Boolean(link.canViewReservations),
        canViewLessonNotes: Boolean(link.canViewLessonNotes),
        canViewHomework: Boolean(link.canViewHomework),
        canViewPayments: Boolean(link.canViewPayments),
        canReceiveNotifications: Boolean(link.canReceiveNotifications),
        createdAt: link.createdAt || null,
        updatedAt: link.updatedAt || null,
        unlinkedAt: link.unlinkedAt || null,
      };
    });
}

function ensureParentUserByEmail(store, email, displayName = "", phone = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("保護者メールアドレスを入力してください。");
  const existing = store.users.find((user) => user.email === normalizedEmail) || null;
  if (existing && existing.role !== "parent") {
    throw new Error("同じメールアドレスに parent 以外のアカウントが存在します。");
  }
  const user = ensureUser(store, {
    email: normalizedEmail,
    role: "parent",
    displayName: String(displayName || "").trim() || undefined,
  });
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) {
    user.phone = normalizedPhone;
    user.phoneNormalized = normalizedPhone;
    user.updatedAt = nowIso();
  }
  return user;
}

function ensurePaymentModule(store) {
  if (!store.paymentGlobalRule || typeof store.paymentGlobalRule !== "object") {
    store.paymentGlobalRule = { taxRatePercent: 10, bonusTiers: [], updatedAt: nowIso() };
  } else {
    if (store.paymentGlobalRule.taxRatePercent === undefined) store.paymentGlobalRule.taxRatePercent = 10;
    if (!Array.isArray(store.paymentGlobalRule.bonusTiers)) store.paymentGlobalRule.bonusTiers = [];
    if (!store.paymentGlobalRule.updatedAt) store.paymentGlobalRule.updatedAt = nowIso();
  }
  if (!Array.isArray(store.paymentRuleTemplates)) store.paymentRuleTemplates = [];
  if (!Array.isArray(store.paymentStudentAssignments)) store.paymentStudentAssignments = [];
  if (!Array.isArray(store.paymentRuleHistory)) store.paymentRuleHistory = [];
  if (!Array.isArray(store.paymentTransactions)) store.paymentTransactions = [];
  if (!Array.isArray(store.paymentCompletionLogs)) store.paymentCompletionLogs = [];
  if (!Array.isArray(store.paymentEvents)) store.paymentEvents = [];
}

const PAYMENT_EVENT_TYPES = new Set(["PAYMENT", "USAGE", "CANCEL", "ADJUSTMENT", "REFUND"]);

function normalizePaymentEventType(value) {
  const key = String(value || "").trim().toUpperCase();
  return PAYMENT_EVENT_TYPES.has(key) ? key : "ADJUSTMENT";
}

function buildEventResultSnapshot(student) {
  return {
    pointsBalance: Number(student?.points?.balance || 0),
    totalMinutes: Number(student?.lessonMinutes?.totalMinutes || 0),
    usedMinutes: Number(student?.lessonMinutes?.usedMinutes || 0),
    remainingMinutes: Number(student?.lessonMinutes?.remainingMinutes || 0),
    capturedAt: nowIso(),
  };
}

function appendPaymentEvent(store, payload = {}) {
  ensurePaymentModule(store);
  const event = {
    id: newId(),
    at: String(payload.at || nowIso()).trim() || nowIso(),
    eventType: normalizePaymentEventType(payload.eventType),
    studentId: String(payload.studentId || "").trim() || null,
    transactionId: String(payload.transactionId || "").trim() || null,
    relatedTransactionId: String(payload.relatedTransactionId || "").trim() || null,
    reason: String(payload.reason || "").trim() || null,
    actorRole: payload.actorRole || "system",
    actorUserId: payload.actorUserId || null,
    payloadSnapshot: payload.payloadSnapshot || null,
    ruleSnapshot: payload.ruleSnapshot || null,
    resultSnapshot: payload.resultSnapshot || null,
    isVoided: false,
    voidedAt: null,
    voidReason: null,
  };
  store.paymentEvents.push(event);
  return event;
}

function resolvePaymentRuleForStudent(store, studentId, paidAtIso) {
  ensurePaymentModule(store);
  const at = String(paidAtIso || "").trim() || nowIso();
  const rows = store.paymentStudentAssignments.filter((a) => {
    if (!a || a.studentId !== studentId) return false;
    const from = String(a.effectiveFrom || "").trim();
    const to = a.effectiveTo ? String(a.effectiveTo).trim() : "";
    if (from && from > at) return false;
    if (to && to <= at) return false;
    return true;
  });
  const rank = (k) => (k === "individual" ? 0 : k === "bulk" ? 1 : 2);
  rows.sort((a, b) => {
    const dr = rank(a.kind) - rank(b.kind);
    if (dr !== 0) return dr;
    return String(b.effectiveFrom || "").localeCompare(String(a.effectiveFrom || ""));
  });
  const pick = rows.find((r) => r.kind === "individual") || rows.find((r) => r.kind === "bulk") || null;
  if (!pick) {
    return { layer: "basic", template: null, assignmentId: null, templateId: null };
  }
  const template = store.paymentRuleTemplates.find((t) => t.id === pick.templateId) || null;
  return {
    layer: pick.kind === "individual" ? "individual" : "bulk",
    template,
    assignmentId: pick.id,
    templateId: pick.templateId,
  };
}

function buildPaymentRuleSnapshot(store, resolved, calc, appliedRuleId) {
  return {
    version: 1,
    appliedRuleType: calc.appliedRuleType,
    appliedRuleId: appliedRuleId || null,
    resolvedLayer: resolved.layer,
    templateId: resolved.templateId || null,
    assignmentId: resolved.assignmentId || null,
    taxRatePercent: calc.tax.taxRatePercent,
    taxInputMode: calc.tax.taxInputMode,
    baseConversion: calc.baseConversionRule,
    bonusTiers: calc.bonusTiersSnapshot,
    timeConversion: calc.timeConversionRule,
    globalBonusTiersWhenBasic: resolved.layer === "basic" ? store.paymentGlobalRule.bonusTiers : null,
    computedAt: nowIso(),
  };
}

export async function readStore() {
  await ensureStoreFile();
  const filePath = authStorePath();
  const raw = await fs.readFile(filePath, "utf8");
  let data;

  try {
    data = raw.trim() ? JSON.parse(raw) : emptyStore();
  } catch {
    data = emptyStore();
  }

  if (!data.users) data.users = [];
  if (!data.loginTokens) data.loginTokens = [];
  if (!data.passwordResetTokens) data.passwordResetTokens = [];
  if (!Array.isArray(data.adminPasswordResetTokens)) data.adminPasswordResetTokens = [];
  if (!Array.isArray(data.adminPasswordResetRateLog)) data.adminPasswordResetRateLog = [];
  if (!data.sessions) data.sessions = [];
  if (!data.students) data.students = [];
  if (!data.studentPairs) data.studentPairs = [];
  if (!data.studentParents) data.studentParents = [];
  if (!data.userStudentLinks) data.userStudentLinks = [];
  if (!data.auditLogs) data.auditLogs = [];
  if (!data.mailLogs) data.mailLogs = [];
  if (!data.mailTemplateSettings) data.mailTemplateSettings = [];
  if (!data.systemSettings) data.systemSettings = null;
  if (!data.systemSettingLogs) data.systemSettingLogs = [];
  if (!data.lessonMinuteLogs) data.lessonMinuteLogs = [];
  if (!Array.isArray(data.lessonMinuteLedger)) data.lessonMinuteLedger = [];
  if (!Array.isArray(data.lessonMinuteJournal)) data.lessonMinuteJournal = [];
  if (!data.lessonMinutePackages) data.lessonMinutePackages = [];
  if (!data.lessonNotes) data.lessonNotes = [];
  if (!data.lessonNoteStudents) data.lessonNoteStudents = [];
  if (!data.homeworks) data.homeworks = [];
  if (!data.homeworkTemplates) data.homeworkTemplates = [];
  if (!data.pointConversionRules) data.pointConversionRules = [];
  if (!data.pointTimeConversionRules) data.pointTimeConversionRules = [];
  if (!data.reservationPolicy) data.reservationPolicy = null;
  if (!data.notices) data.notices = [];
  if (!data.reservations) data.reservations = [];
  if (!data.reservationSlots) data.reservationSlots = [];
  if (!data.paymentGlobalRule) data.paymentGlobalRule = { taxRatePercent: 10, bonusTiers: [], updatedAt: nowIso() };
  if (!Array.isArray(data.paymentRuleTemplates)) data.paymentRuleTemplates = [];
  if (!Array.isArray(data.paymentStudentAssignments)) data.paymentStudentAssignments = [];
  if (!Array.isArray(data.paymentRuleHistory)) data.paymentRuleHistory = [];
  if (!Array.isArray(data.paymentTransactions)) data.paymentTransactions = [];
  if (!Array.isArray(data.paymentCompletionLogs)) data.paymentCompletionLogs = [];
  if (!Array.isArray(data.paymentEvents)) data.paymentEvents = [];
  if (!Array.isArray(data.processedLessonMinuteOpIds)) data.processedLessonMinuteOpIds = [];
  if (!Array.isArray(data.roleInvitations)) data.roleInvitations = [];
  if (!Array.isArray(data.teacherAvailabilityProfiles)) data.teacherAvailabilityProfiles = [];
  if (!Array.isArray(data.pointLedgers)) data.pointLedgers = [];

  data.users.forEach((user) => migrateUserShape(user));
  data.mailLogs.forEach((log) => migrateMailLogShape(log));
  data.mailTemplateSettings.forEach((item) => migrateMailTemplateSettingShape(item));
  data.students.forEach((student) => migrateStudentShape(student));
  data.studentPairs.forEach((pair) => migrateStudentPairShape(pair));
  data.studentParents.forEach((link) => migrateStudentParentShape(link));
  data.lessonNotes.forEach((note) => migrateLessonNoteShape(note));
  data.lessonNoteStudents.forEach((link) => migrateLessonNoteStudentShape(link));
  data.homeworks.forEach((homework) => migrateHomeworkShape(homework));
  data.homeworkTemplates.forEach((template) => migrateHomeworkTemplateShape(template));
  data.students.forEach((student) => resetLegacyInitialMinutesIfNeeded(data, student));
  data.students.forEach((student) => assignStudentNumberIfNeeded(data, student));
  ensureLessonMinutePackages(data);
  data.lessonMinutePackages.forEach((pkg) => migrateLessonMinutePackageShape(pkg));
  ensurePointConversionRules(data);
  data.pointConversionRules.forEach((rule) => migratePointConversionRuleShape(rule));
  ensurePointTimeConversionRules(data);
  data.pointTimeConversionRules.forEach((rule) => migratePointTimeConversionRuleShape(rule));
  ensureReservationPolicy(data);
  ensureSystemSettings(data);
  ensureNotices(data);
  data.notices.forEach((notice) => migrateNoticeShape(notice));
  ensureReservationSlots(data);
  data.reservationSlots.forEach((slot) => migrateSlotShape(slot));
  data.reservations.forEach((reservation) => migrateReservationShape(data, reservation));
  ensurePrimarySuperAdminUser(data);
  data.students.forEach((student) => ensureInitialStudentPasswordIfPossible(data, student));
  ensurePaymentModule(data);
  ensureLessonMinuteLedgerBackfill(data);
  ensureLessonMinuteJournalFromLogs(data);

  return data;
}

async function writeStore(store) {
  const filePath = authStorePath();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

function enqueue(work) {
  queue = queue.then(work, work);
  return queue;
}

function toMs(iso) {
  return new Date(iso).getTime();
}

function cleanExpired(store) {
  const now = Date.now();

  store.loginTokens = store.loginTokens.filter((t) => {
    if (t.usedAt) return true;
    return toMs(t.expiresAt) > now;
  });

  store.sessions = store.sessions.filter((s) => toMs(s.expiresAt) > now);
  store.passwordResetTokens = (store.passwordResetTokens || []).filter((t) => {
    if (t.usedAt) return true;
    return toMs(t.expiresAt) > now;
  });
  store.adminPasswordResetTokens = (store.adminPasswordResetTokens || []).filter((t) => {
    if (t.usedAt) return true;
    return toMs(t.expiresAt) > now;
  });
  const rateCutoff = now - ADMIN_PWD_RESET_RATE_WINDOW_MS;
  store.adminPasswordResetRateLog = (store.adminPasswordResetRateLog || []).filter((row) => {
    const t = toMs(row.at);
    return !Number.isNaN(t) && t > rateCutoff;
  });
}

function displayNameFromEmail(email) {
  const local = email.split("@")[0] || "user";
  return local;
}

function listAdminEmails() {
  return String(process.env.AUTH_ADMIN_EMAILS || "")
    .split(",")
    .map((v) => normalizeEmail(v))
    .filter(Boolean);
}

function resolveRoleForEmail(email, requestedRole) {
  const normalized = normalizeEmail(email);
  const adminEmails = listAdminEmails();
  const requested = String(requestedRole || "").trim().toLowerCase();

  if (requested === "student") return "student";
  if (requested === "admin") return "admin";
  if (requested === "super_admin") return "admin";
  if (requested === "teacher") return "teacher";
  if (requested === "parent") return "parent";
  if (adminEmails.includes(normalized)) return "admin";
  return "student";
}

function writeAuditLog(store, { actorUserId = null, actorRole = null, action, targetType, targetId = null, summary = "", meta = {} }) {
  store.auditLogs.push({
    id: newId(),
    at: nowIso(),
    actorUserId,
    actorRole,
    action,
    targetType,
    targetId,
    summary,
    meta,
  });

  if (store.auditLogs.length > AUDIT_LOG_LIMIT) {
    store.auditLogs = store.auditLogs.slice(-AUDIT_LOG_LIMIT);
  }
}

function findLinkedStudent(store, userId) {
  const link = store.userStudentLinks.find((item) => item.userId === userId);
  if (!link) return null;
  return store.students.find((item) => item.id === link.studentId) || null;
}

function resolveUserByLoginId(store, loginId, expectedRole = null) {
  const raw = String(loginId || "").trim();
  if (!raw) return null;
  const normalizedEmail = normalizeEmail(raw);
  const normalizedPhone = normalizePhone(raw);
  const normalizedStudentNumber = normalizeStudentNumber(raw);

  const byEmail = store.users.find((user) => user.email === normalizedEmail) || null;
  const byUserPhone =
    !byEmail && normalizedPhone
      ? store.users.find((user) => normalizePhone(user.phoneNormalized || user.phone) === normalizedPhone) || null
      : null;
  const candidateStudents = [];
  if (!byEmail && !byUserPhone) {
    const studentByEmail = store.students.find((student) => normalizeEmail(student.email) === normalizedEmail) || null;
    if (studentByEmail) candidateStudents.push(studentByEmail);
    const studentByPhone =
      store.students.find(
        (student) => normalizePhone(student.phoneNormalized || student.phone || student?.crmProfile?.phoneMobile) === normalizedPhone
      ) || null;
    if (studentByPhone) candidateStudents.push(studentByPhone);
    const studentByStudentNumber =
      store.students.find(
        (student) => normalizeStudentNumber(student.studentNumber || "") === normalizedStudentNumber
      ) || null;
    if (studentByStudentNumber) candidateStudents.push(studentByStudentNumber);
  }

  const uniqueStudentIds = [...new Set(candidateStudents.map((student) => student.id))];
  const byStudentLink =
    uniqueStudentIds
      .map((studentId) => findUserByStudentId(store, studentId))
      .find(Boolean) || null;

  const user = byEmail || byUserPhone || byStudentLink;
  if (!user) return null;
  if (expectedRole && user.role !== expectedRole) return null;
  if (user.status === "inactive") return null;
  return user;
}

function createSessionForUser(store, user, requestIp = null, userAgent = null) {
  const issuedAt = nowIso();
  const rawSession = crypto.randomBytes(24).toString("hex");
  const session = {
    id: newId(),
    userId: user.id,
    sessionHash: hashToken(rawSession),
    createdAt: issuedAt,
    lastSeenAt: issuedAt,
    expiresAt: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString(),
    createdIp: requestIp,
    createdUserAgent: userAgent,
  };
  store.sessions.push(session);
  user.lastLoginAt = issuedAt;
  user.updatedAt = issuedAt;
  return { rawSession, session };
}

function studentNextPath(student) {
  if (!student) return "/student/register/start";
  if (student.registrationStatus === "completed") return "/student";
  if (student.consentStatus !== "agreed") {
    return "/student/register/consent";
  }
  return "/student/register/profile";
}

function roleNextPath(user, student) {
  if (user.mustChangePassword) return "/password/change-required";
  if (user.role === "admin") return "/admin";
  if (user.role === "teacher") return "/teacher";
  if (user.role === "parent") return "/parent";
  return studentNextPath(student);
}

function normalizeInstructorUserId(value) {
  const raw = String(value || "").trim();
  return raw || null;
}

function resolveInstructorName(store, instructorUserId) {
  if (!instructorUserId) return null;
  const teacher = store.users.find((user) => user.id === instructorUserId && user.role === "teacher");
  if (!teacher) return null;
  return teacher.displayName || teacher.email || null;
}

function ensureUser(store, { email, role, displayName }) {
  const normalizedEmail = normalizeEmail(email);
  let user = store.users.find((u) => u.email === normalizedEmail);
  const ts = nowIso();
  const resolvedRole = resolveRoleForEmail(normalizedEmail, role);

  if (!user) {
    user = {
      id: newId(),
      email: normalizedEmail,
      displayName: displayName || displayNameFromEmail(normalizedEmail),
      role: resolvedRole,
      status: "active",
      nameFurigana: "",
      phone: "",
      phoneNormalized: "",
      adminRank: "",
      passwordHash: null,
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: ts,
      updatedAt: ts,
      lastLoginAt: null,
    };
    store.users.push(user);
    return user;
  }

  user.role = user.role || resolvedRole;
  if (resolvedRole === "admin" && user.role !== "admin") {
    user.role = "admin";
  }
  if (displayName && !user.displayName) {
    user.displayName = displayName;
  }
  user.phoneNormalized = normalizePhone(user.phoneNormalized || user.phone);
  user.updatedAt = ts;
  return user;
}

function ensurePrimarySuperAdminUser(store) {
  const normalizedEmail = normalizeEmail(PRIMARY_SUPER_ADMIN.email);
  const normalizedPhone = normalizePhone(PRIMARY_SUPER_ADMIN.phone);
  const ts = nowIso();
  let user = store.users.find((item) => item.email === normalizedEmail) || null;

  if (!user) {
    user = {
      id: newId(),
      email: normalizedEmail,
      displayName: PRIMARY_SUPER_ADMIN.displayName,
      nameFurigana: PRIMARY_SUPER_ADMIN.nameFurigana,
      role: PRIMARY_SUPER_ADMIN.role,
      adminRank: PRIMARY_SUPER_ADMIN.adminRank,
      status: "active",
      phone: PRIMARY_SUPER_ADMIN.phone,
      phoneNormalized: normalizedPhone,
      passwordHash: hashPassword(PRIMARY_SUPER_ADMIN.initialPassword),
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: ts,
      updatedAt: ts,
      lastLoginAt: null,
    };
    store.users.push(user);
    return;
  }

  user.displayName = user.displayName || PRIMARY_SUPER_ADMIN.displayName;
  user.nameFurigana = user.nameFurigana || PRIMARY_SUPER_ADMIN.nameFurigana;
  user.role = "admin";
  user.adminRank = PRIMARY_SUPER_ADMIN.adminRank;
  user.phone = user.phone || PRIMARY_SUPER_ADMIN.phone;
  user.phoneNormalized = normalizePhone(user.phoneNormalized || user.phone || PRIMARY_SUPER_ADMIN.phone);
  if (!user.passwordHash) {
    user.passwordHash = hashPassword(PRIMARY_SUPER_ADMIN.initialPassword);
    user.mustChangePassword = false;
  }
  user.failedLoginCount = Math.max(0, Number(user.failedLoginCount || 0));
  user.lockedUntil = String(user.lockedUntil || "").trim() || null;
  if (user.status === "inactive") user.status = "active";
  user.updatedAt = ts;
}

function createLoginToken(store, { user, email, requestIp, userAgent, nextPath }) {
  const rawToken = crypto.randomBytes(24).toString("hex");
  const token = {
    id: newId(),
    userId: user.id,
    email: normalizeEmail(email),
    tokenHash: hashToken(rawToken),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_TTL_MINUTES * 60 * 1000).toISOString(),
    usedAt: null,
    requestIp,
    requestUserAgent: userAgent,
    nextPath: String(nextPath || "/login/next"),
  };
  store.loginTokens.push(token);
  return { rawToken, token };
}

function createPasswordResetToken(store, { user, email, requestIp, userAgent }) {
  const rawToken = crypto.randomBytes(24).toString("hex");
  const token = {
    id: newId(),
    userId: user.id,
    email: normalizeEmail(email),
    tokenHash: hashToken(rawToken),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString(),
    usedAt: null,
    requestIp,
    requestUserAgent: userAgent,
    consumeIp: null,
    consumeUserAgent: null,
  };
  store.passwordResetTokens.push(token);
  return { rawToken, token };
}

function createAdminPasswordResetToken(store, { user, email, requestIp, userAgent }) {
  const rawToken = crypto.randomBytes(24).toString("hex");
  const token = {
    id: newId(),
    userId: user.id,
    email: normalizeEmail(email),
    tokenHash: hashToken(rawToken),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + ADMIN_PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString(),
    usedAt: null,
    requestIp,
    requestUserAgent: userAgent,
    consumeIp: null,
    consumeUserAgent: null,
  };
  if (!Array.isArray(store.adminPasswordResetTokens)) store.adminPasswordResetTokens = [];
  store.adminPasswordResetTokens.push(token);
  return { rawToken, token };
}

function invalidatePendingAdminPasswordResetTokensForUser(store, userId) {
  const uid = String(userId || "");
  store.adminPasswordResetTokens = (store.adminPasswordResetTokens || []).map((t) => {
    if (t.userId === uid && !t.usedAt) {
      return { ...t, usedAt: nowIso(), consumeUserAgent: "invalidated_new_request" };
    }
    return t;
  });
}

function invalidateAllSessionsForUser(store, userId) {
  const uid = String(userId || "");
  store.sessions = (store.sessions || []).filter((s) => String(s.userId) !== uid);
}

function adminPwdResetRateAllowed(store, requestIp, emailNorm) {
  const ip = String(requestIp || "unknown").slice(0, 128);
  const em = String(emailNorm || "").toLowerCase().slice(0, 320);
  const log = store.adminPasswordResetRateLog || [];
  const ipCount = log.filter((r) => r.ip === ip).length;
  const emailCount = em ? log.filter((r) => r.emailNorm === em).length : 0;
  if (ipCount >= ADMIN_PWD_RESET_MAX_PER_IP) return false;
  if (em && emailCount >= ADMIN_PWD_RESET_MAX_PER_EMAIL) return false;
  return true;
}

function recordAdminPwdResetAttempt(store, requestIp, emailNorm) {
  if (!Array.isArray(store.adminPasswordResetRateLog)) store.adminPasswordResetRateLog = [];
  store.adminPasswordResetRateLog.push({
    at: nowIso(),
    ip: String(requestIp || "unknown").slice(0, 128),
    emailNorm: String(emailNorm || "").toLowerCase().slice(0, 320),
  });
}

function findUserByStudentId(store, studentId) {
  const link = store.userStudentLinks.find((item) => item.studentId === studentId);
  if (!link) return null;
  return store.users.find((user) => user.id === link.userId) || null;
}

function ensureInitialStudentPasswordIfPossible(store, student) {
  const user = findUserByStudentId(store, student.id);
  if (!user || user.role !== "student") return false;
  if (user.passwordHash) return false;
  return ensureInitialPasswordForUserByPolicy(
    store,
    user,
    student?.phoneNormalized || student?.phone || student?.crmProfile?.phoneMobile
  ).provisioned;
}

function applyStudentProfilePatch(student, payload) {
  if (payload?.nameKanji !== undefined) {
    student.nameKanji = String(payload.nameKanji || "").trim();
  }
  if (payload?.nameFurigana !== undefined) {
    student.nameFurigana = String(payload.nameFurigana || "").trim();
  }
  student.crmProfile.addressLine1 = String(payload?.addressLine1 || payload?.address || "").trim();
  student.crmProfile.addressLine2 = String(payload?.addressLine2 || "").trim();
  student.crmProfile.postalCode = String(payload?.postalCode || "").trim();
  student.crmProfile.birthDate = normalizeDate(payload?.birthDate || "");
  student.crmProfile.phoneMobile = normalizePhone(payload?.phoneMobile || payload?.phone || "");
  student.crmProfile.phoneEmergency = normalizePhone(payload?.phoneEmergency || "");
  if (payload?.emergencyContactName !== undefined) {
    student.crmProfile.emergencyContactName = String(payload.emergencyContactName || "").trim();
  }
  if (payload?.emergencyContactNameFurigana !== undefined) {
    student.crmProfile.emergencyContactNameFurigana = String(payload.emergencyContactNameFurigana || "").trim();
  }
  if (payload?.emergencyContactRelation !== undefined) {
    student.crmProfile.emergencyContactRelation = String(payload.emergencyContactRelation || "").trim();
  }
  if (payload?.nameKorean !== undefined) {
    student.crmProfile.nameKorean = String(payload.nameKorean || "").trim();
  }
  if (payload?.profileImageDataUrl !== undefined) {
    student.crmProfile.profileImageDataUrl = String(payload.profileImageDataUrl || "").trim();
  }
  if (payload?.adminStudentTendency !== undefined) {
    student.crmProfile.adminStudentTendency = String(payload.adminStudentTendency || "").trim();
  }
  if (payload?.adminLessonCautions !== undefined) {
    student.crmProfile.adminLessonCautions = String(payload.adminLessonCautions || "").trim();
  }
  if (payload?.adminResponseStyle !== undefined) {
    student.crmProfile.adminResponseStyle = String(payload.adminResponseStyle || "").trim();
  }
  if (payload?.adminLearningTraits !== undefined) {
    student.crmProfile.adminLearningTraits = String(payload.adminLearningTraits || "").trim();
  }
  if (payload?.adminCounselMemo !== undefined) {
    student.crmProfile.adminCounselMemo = String(payload.adminCounselMemo || "").trim();
  }
  student.crmProfile.notes = String(payload?.notes || payload?.extraInfo || "").trim();

  // Compatibility mirror values
  student.address = student.crmProfile.addressLine1;
  student.birthDate = student.crmProfile.birthDate;
  student.phone = student.crmProfile.phoneMobile;
  student.phoneNormalized = normalizePhone(student.crmProfile.phoneMobile || student.phone);
  student.extraInfo = student.crmProfile.notes;
}

function toStudentDto(student, user = null, pairInfo = null) {
  const studentUpdatedAt = student.updatedAt || null;
  const linkedUserLastLoginAt = user?.lastLoginAt || null;
  const recentActivityAt = [studentUpdatedAt, linkedUserLastLoginAt]
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || null;

  return {
    id: student.id,
    studentNumber: student.studentNumber,
    nameKanji: student.nameKanji,
    nameFurigana: student.nameFurigana,
    email: student.email,
    registrationStatus: student.registrationStatus,
    consentStatus: student.consentStatus,
    consentAgreedAt: student.consentAgreedAt || null,
    address: student.address,
    birthDate: student.birthDate,
    phone: student.phone,
    extraInfo: student.extraInfo,
    crmProfile: student.crmProfile,
    linkedUserId: user?.id || null,
    linkedUserEmail: user?.email || null,
    linkedUserRole: user?.role || null,
    linkedUserLastLoginAt,
    lessonMinutes: student.lessonMinutes,
    points: student.points,
    pairInfo,
    isMinor: Boolean(student.isMinor),
    guardianRequired: Boolean(student.guardianRequired),
    guardianMemo: String(student.guardianMemo || ""),
    studentUpdatedAt,
    recentActivityAt,
  };
}

function filterStudents(students, filters) {
  const query = String(filters?.q || "").trim().toLowerCase();
  const registrationStatus = String(filters?.registrationStatus || "").trim();
  const consentStatus = String(filters?.consentStatus || "").trim();
  const linked = String(filters?.linked || "").trim();

  return students.filter((item) => {
    if (query) {
      const haystack = [item.studentNumber, item.nameKanji, item.nameFurigana, item.email, item.linkedUserEmail, item.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) {
        const qd = query.replace(/\D/g, "");
        const pd = String(item.phone || "")
          .replace(/\D/g, "")
          .toLowerCase();
        if (qd.length < 3 || !pd.includes(qd)) return false;
      }
    }

    if (registrationStatus && item.registrationStatus !== registrationStatus) return false;
    if (consentStatus && item.consentStatus !== consentStatus) return false;
    if (linked === "linked" && !item.linkedUserId) return false;
    if (linked === "unlinked" && item.linkedUserId) return false;

    return true;
  });
}

/** @returns {boolean} */
function studentMatchesRiskSignalFilter(badges, riskSignal) {
  const sig = String(riskSignal || "").trim();
  if (!sig) return true;
  const ids = new Set((badges || []).map((b) => b.id));
  if (sig === "any") return (badges || []).length > 0;
  if (sig === "reservation_gap") return ids.has("gap_long") || ids.has("no_res_hist");
  if (sig === "homework_backlog") return ids.has("hw_backlog");
  if (sig === "note_stale") return ids.has("note_stale") || ids.has("no_note");
  if (sig === "post_reg_idle") return ids.has("post_reg_idle");
  if (sig === "minutes_depleted") return ids.has("minutes_depleted") || ids.has("minutes_exhausted");
  if (sig === "minutes_exhausted") return ids.has("minutes_exhausted") || ids.has("minutes_depleted");
  if (sig === "minutes_low") return ids.has("minutes_low");
  if (sig === "minutes_short_next") return ids.has("minutes_short_next") || ids.has("minutes_will_run_out");
  if (sig === "minutes_will_run_out") return ids.has("minutes_will_run_out") || ids.has("minutes_short_next");
  return true;
}

function paginate(items, pageInput, pageSizeInput) {
  const pageSize = Math.max(1, Math.min(100, Number(pageSizeInput || 10)));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(totalPages, Number(pageInput || 1)));
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
}

function toDateRange(fromDate, toDate) {
  const from = String(fromDate || "").trim();
  const to = String(toDate || "").trim();
  const fromAt = from ? new Date(`${from}T00:00:00.000Z`).toISOString() : null;
  const toAt = to ? new Date(`${to}T23:59:59.999Z`).toISOString() : null;
  return { fromAt, toAt };
}

function matchesStudentFilter(log, studentId) {
  if (!studentId) return true;
  if (log.targetType === "student" && log.targetId === studentId) return true;
  if (log.meta?.studentId === studentId) return true;
  return false;
}

function normalizeReservationStatus(status) {
  const value = String(status || "").trim();
  const allowed = new Set(["requested", "confirmed", "change_requested", "rejected", "cancelled", "completed"]);
  if (allowed.has(value)) return value;
  return "requested";
}

function normalizeAttendanceStatus(status) {
  const value = String(status || "").trim();
  const allowed = new Set(["scheduled", "attended", "no_show"]);
  if (allowed.has(value)) return value;
  return "scheduled";
}

function normalizeLessonMode(value) {
  const raw = String(value || "").trim();
  return raw === "group" ? "group" : "one_on_one";
}

function normalizeLessonDeliveryType(value) {
  const raw = String(value || "").trim();
  return raw === "online" ? "online" : "in_person";
}

function normalizeLessonGroupType(value, lessonMode = "one_on_one") {
  const raw = String(value || "").trim();
  if (raw === "pair") return "pair";
  if (raw === "open_group") return "open_group";
  return normalizeLessonMode(lessonMode) === "group" ? "open_group" : "single";
}

function defaultCapacityForLessonMode(lessonMode) {
  return normalizeLessonMode(lessonMode) === "group" ? 4 : 1;
}

function normalizeReservationDate(value) {
  const raw = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function normalizeReservationTime(value) {
  const raw = String(value || "").trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : "";
}

function normalizeReservationPayload(payload) {
  return {
    slotId: String(payload?.slotId || "").trim(),
    date: normalizeReservationDate(payload?.date),
    time: normalizeReservationTime(payload?.time),
    durationMinutes: Math.max(30, Number(payload?.durationMinutes || 50)),
    lessonDeliveryType: normalizeLessonDeliveryType(payload?.lessonDeliveryType),
    memo: String(payload?.memo || "").trim(),
    lessonServiceId: String(payload?.lessonServiceId || payload?.lessonTypeId || "").trim(),
  };
}

function makeIsoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function ensureLessonMinutePackages(store) {
  if (store.lessonMinutePackages.length > 0) return;
  const now = nowIso();
  store.lessonMinutePackages = [
    {
      id: newId(),
      name: "60分パッケージ",
      minutes: 60,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      name: "120分パッケージ",
      minutes: 120,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      name: "180分パッケージ",
      minutes: 180,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function migrateLessonMinutePackageShape(pkg) {
  pkg.name = String(pkg.name || "").trim() || "Unnamed package";
  pkg.minutes = Math.max(1, Number(pkg.minutes || 60));
  pkg.isActive = pkg.isActive !== false;
  if (!pkg.createdAt) pkg.createdAt = nowIso();
  if (!pkg.updatedAt) pkg.updatedAt = pkg.createdAt;
}

function ensurePointConversionRules(store) {
  if (store.pointConversionRules.length > 0) return;
  const now = nowIso();
  store.pointConversionRules = [
    { id: newId(), yenAmount: 1, points: 1, isActive: true, createdAt: now, updatedAt: now },
    { id: newId(), yenAmount: 1, points: 2, isActive: false, createdAt: now, updatedAt: now },
    { id: newId(), yenAmount: 10, points: 4, isActive: false, createdAt: now, updatedAt: now },
  ];
}

function migratePointConversionRuleShape(rule) {
  rule.yenAmount = Math.max(1, Number(rule.yenAmount || 1));
  rule.points = Math.max(1, Number(rule.points || 1));
  rule.isActive = rule.isActive !== false;
  if (!rule.createdAt) rule.createdAt = nowIso();
  if (!rule.updatedAt) rule.updatedAt = rule.createdAt;
}

function ensurePointTimeConversionRules(store) {
  if (store.pointTimeConversionRules.length > 0) return;
  const now = nowIso();
  store.pointTimeConversionRules = [
    {
      id: newId(),
      pointAmount: 1,
      minutes: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function normalizeInstructorAssignmentMode(mode) {
  const value = String(mode || "").trim().toLowerCase();
  if (value === "student_select") return "student_select";
  if (value === "hybrid") return "hybrid";
  return "auto";
}

function normalizeTimeGenerationMode(mode) {
  const value = String(mode || "").trim().toLowerCase();
  if (value === "all_times") return "all_times";
  if (value === "course_auto") return "course_auto";
  if (value === "direct_input") return "direct_input";
  return "direct_input";
}

function normalizeClockTime(value, fallback = "10:00") {
  const raw = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(raw)) return fallback;
  const [hh, mm] = raw.split(":").map((v) => Number(v || 0));
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return fallback;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function normalizeCourseDurations(values) {
  const input = Array.isArray(values) ? values : [];
  const normalized = [...new Set(input.map((v) => Math.max(30, Number(v || 0))).filter((v) => Number.isFinite(v) && v > 0))]
    .sort((a, b) => a - b)
    .slice(0, 10);
  return normalized.length > 0 ? normalized : [60];
}

function migrateReservationPolicyShape(policy) {
  policy.scope = "global";
  policy.instructorAssignmentMode = normalizeInstructorAssignmentMode(policy.instructorAssignmentMode);
  policy.timeGenerationMode = normalizeTimeGenerationMode(policy.timeGenerationMode);
  policy.operatingStartTime = normalizeClockTime(policy.operatingStartTime, "10:00");
  policy.operatingEndTime = normalizeClockTime(policy.operatingEndTime, "19:00");
  if (timeToMinutes(policy.operatingEndTime) <= timeToMinutes(policy.operatingStartTime)) {
    policy.operatingEndTime = "19:00";
  }
  policy.prepMinutes = Math.max(0, Number(policy.prepMinutes || 10));
  policy.courseDurations = normalizeCourseDurations(policy.courseDurations);
  if (policy.useClassroomHoursForSlotGeneration === undefined) {
    policy.useClassroomHoursForSlotGeneration = true;
  }
  if (!policy.createdAt) policy.createdAt = nowIso();
  if (!policy.updatedAt) policy.updatedAt = policy.createdAt;
}

function ensureReservationPolicy(store) {
  if (!store.reservationPolicy) {
    const now = nowIso();
    store.reservationPolicy = {
      scope: "global",
      instructorAssignmentMode: "auto",
      timeGenerationMode: "direct_input",
      operatingStartTime: "10:00",
      operatingEndTime: "19:00",
      prepMinutes: 10,
      courseDurations: [60, 90],
      useClassroomHoursForSlotGeneration: true,
      createdAt: now,
      updatedAt: now,
    };
    return;
  }
  migrateReservationPolicyShape(store.reservationPolicy);
}

function defaultSystemSettings(store) {
  return {
    schoolBasic: {
      schoolName: "MalMoi Korean School",
      displayName: "MalMoi 韓国語教室",
      phone: PRIMARY_SUPER_ADMIN.phone,
      email: PRIMARY_SUPER_ADMIN.email,
      address: "",
      businessHoursStart: store?.reservationPolicy?.operatingStartTime || "10:00",
      businessHoursEnd: store?.reservationPolicy?.operatingEndTime || "19:00",
      holidays: "",
    },
    reservation: {
      reservationMode: "time_unit",
      timeGenerationMode: store?.reservationPolicy?.timeGenerationMode || "direct_input",
      operatingStartTime: store?.reservationPolicy?.operatingStartTime || "10:00",
      operatingEndTime: store?.reservationPolicy?.operatingEndTime || "19:00",
      prepMinutes: Number(store?.reservationPolicy?.prepMinutes || 10),
      maxBookableDays: RESERVATION_STUDENT_BOOKABLE_DAYS,
      allowSameDayBooking: true,
      cancelCutoffHours: Math.floor(STUDENT_CANCEL_CUTOFF_MINUTES / 60) || 3,
      approvalMode: "admin",
      calendarDisplayShowCancelled: false,
      studentChangeDeadlineDays: 3,
      useClassroomHoursForSlotGeneration: store?.reservationPolicy?.useClassroomHoursForSlotGeneration !== false,
      minBookingLeadMinutes: 0,
      adminOverrideSameDay: true,
      studentUiShowExpectedPoints: false,
      studentUiShowBalanceAfterBooking: false,
    },
    lesson: {
      defaultLessonDurations: normalizeCourseDurations(store?.reservationPolicy?.courseDurations || [60, 90]),
      pairLessonEnabled: true,
      groupLessonEnabled: true,
      maxGroupCapacity: 4,
      autoShareLessonNote: true,
    },
    homework: {
      homeworkEnabled: true,
      statuses: ["not_started", "in_progress", "submitted", "reviewed", "completed"],
      allowStudentStatusUpdate: true,
      allowParentHomeworkView: true,
    },
    notifications: {
      noticePublished: true,
      lessonReminderDayBefore: true,
      lessonReminderSameDay: true,
      homeworkAssigned: true,
      lessonNotePublished: true,
      rules: [],
    },
    classroomOperations: {
      defaultOpen: "10:00",
      defaultClose: "19:00",
      defaultBreaks: [{ start: "12:00", end: "13:00" }],
      weekdayHours: {},
      dateOverrides: [],
    },
    lessonServiceCatalog: {
      services: [],
    },
    paymentMethodsPolicy: {
      methods: [
        {
          id: "in_class",
          labelJa: "教室で支払い",
          enabled: true,
          showToStudent: true,
          requiresAdminConfirm: true,
          description: "レッスン後に窓口でお支払いいただきます。",
        },
        {
          id: "web",
          labelJa: "Webで支払い",
          enabled: false,
          showToStudent: true,
          requiresAdminConfirm: false,
          description: "外部決済は準備中です（未接続）。",
          webProvider: "none",
        },
        {
          id: "bank",
          labelJa: "銀行振込",
          enabled: true,
          showToStudent: true,
          requiresAdminConfirm: true,
          description: "",
        },
        {
          id: "other",
          labelJa: "その他",
          enabled: false,
          showToStudent: false,
          requiresAdminConfirm: true,
          description: "",
        },
      ],
      webProvidersPrepared: { square: false, stripe: false },
      inClassFlowNote: "現場決済のあと、管理者が利用時間（ポイント/分）と紐付けて登録します。",
    },
    teacherSchedulePolicy: {
      editableDaysBefore: 14,
      lockHoursBeforeLesson: 24,
      forcedLocks: [],
      adminOnlyEdit: false,
    },
    mail: {
      sendMode: String(process.env.MAIL_SEND_MODE || "log").trim() || "log",
      mailFrom: String(process.env.MAIL_FROM || "").trim(),
      smtpHost: String(process.env.SMTP_HOST || "").trim(),
      smtpPort: String(process.env.SMTP_PORT || "").trim(),
      smtpUser: String(process.env.SMTP_USER || "").trim(),
      smtpPassMasked: String(process.env.SMTP_PASS || "").trim() ? "********" : "",
      smtpSecure: String(process.env.SMTP_SECURE || "false").trim(),
      note: "実際のSMTP接続は環境変数が優先されます。",
    },
    security: {
      initialPasswordMode: "phone_last4",
      forcePasswordChangeOnFirstLogin: true,
      allowPasswordReset: true,
      loginAttemptLimit: 5,
      adminTwoFactorEnabled: false,
    },
    parent: {
      parentAccountEnabled: true,
      autoParentForMinor: false,
      canViewReservations: true,
      canViewLessonNotes: true,
      canViewHomework: true,
      canViewProgress: true,
    },
    pair: {
      pairLessonEnabled: true,
      pairAutoReservationCreate: false,
      pairShareLessonNote: true,
      pairShareHomework: true,
    },
  };
}

function ensureSystemSettings(store) {
  const defaults = defaultSystemSettings(store);
  if (!store.systemSettings || typeof store.systemSettings !== "object") {
    store.systemSettings = defaults;
    return;
  }
  const current = store.systemSettings;
  store.systemSettings = {
    schoolBasic: { ...defaults.schoolBasic, ...(current.schoolBasic || {}) },
    reservation: { ...defaults.reservation, ...(current.reservation || {}) },
    lesson: {
      ...defaults.lesson,
      ...(current.lesson || {}),
      defaultLessonDurations: normalizeCourseDurations(
        current?.lesson?.defaultLessonDurations || defaults.lesson.defaultLessonDurations
      ),
    },
    homework: {
      ...defaults.homework,
      ...(current.homework || {}),
      statuses: Array.isArray(current?.homework?.statuses)
        ? current.homework.statuses
        : defaults.homework.statuses,
    },
    notifications: {
      ...defaults.notifications,
      ...(current.notifications || {}),
      rules: Array.isArray(current?.notifications?.rules)
        ? current.notifications.rules
        : defaults.notifications.rules,
    },
    classroomOperations: {
      ...defaults.classroomOperations,
      ...(current.classroomOperations || {}),
      defaultBreaks: Array.isArray(current?.classroomOperations?.defaultBreaks)
        ? current.classroomOperations.defaultBreaks
        : defaults.classroomOperations.defaultBreaks,
      weekdayHours:
        current?.classroomOperations?.weekdayHours && typeof current.classroomOperations.weekdayHours === "object"
          ? current.classroomOperations.weekdayHours
          : defaults.classroomOperations.weekdayHours,
      dateOverrides: Array.isArray(current?.classroomOperations?.dateOverrides)
        ? current.classroomOperations.dateOverrides
        : defaults.classroomOperations.dateOverrides,
    },
    lessonServiceCatalog: {
      ...defaults.lessonServiceCatalog,
      ...(current.lessonServiceCatalog || {}),
      services: Array.isArray(current?.lessonServiceCatalog?.services)
        ? current.lessonServiceCatalog.services
        : defaults.lessonServiceCatalog.services,
    },
    paymentMethodsPolicy: {
      ...defaults.paymentMethodsPolicy,
      ...(current.paymentMethodsPolicy || {}),
      methods: Array.isArray(current?.paymentMethodsPolicy?.methods)
        ? current.paymentMethodsPolicy.methods
        : defaults.paymentMethodsPolicy.methods,
      webProvidersPrepared: {
        ...defaults.paymentMethodsPolicy.webProvidersPrepared,
        ...(current?.paymentMethodsPolicy?.webProvidersPrepared || {}),
      },
    },
    teacherSchedulePolicy: {
      ...defaults.teacherSchedulePolicy,
      ...(current.teacherSchedulePolicy || {}),
      forcedLocks: Array.isArray(current?.teacherSchedulePolicy?.forcedLocks)
        ? current.teacherSchedulePolicy.forcedLocks
        : defaults.teacherSchedulePolicy.forcedLocks,
    },
    mail: { ...defaults.mail, ...(current.mail || {}) },
    security: { ...defaults.security, ...(current.security || {}) },
    parent: { ...defaults.parent, ...(current.parent || {}) },
    pair: { ...defaults.pair, ...(current.pair || {}) },
  };
}

function getSecuritySettings(store) {
  ensureSystemSettings(store);
  return store.systemSettings?.security || {};
}

function getParentPolicySettings(store) {
  ensureSystemSettings(store);
  return store.systemSettings?.parent || {};
}

function getPairPolicySettings(store) {
  ensureSystemSettings(store);
  return store.systemSettings?.pair || {};
}

function resolveInitialPasswordByPolicy(store, student = null) {
  const security = getSecuritySettings(store);
  const mode = String(security?.initialPasswordMode || "phone_last4").trim();
  if (mode === "random") {
    return {
      password: crypto.randomBytes(4).toString("hex"),
      hint: "ランダム一時パスワード",
      mode: "random",
    };
  }
  const fromPhone = extractLast4DigitsFromPhone(
    student?.phoneNormalized || student?.phone || student?.crmProfile?.phoneMobile
  );
  if (fromPhone) {
    return { password: fromPhone, hint: "電話番号下4桁", mode: "phone_last4" };
  }
  return {
    password: crypto.randomBytes(4).toString("hex"),
    hint: "ランダム一時パスワード(電話番号未登録)",
    mode: "random_fallback",
  };
}

function ensureInitialPasswordForUserByPolicy(store, user, phoneCandidate = null) {
  if (!user) return { provisioned: false, hint: null, temporaryPassword: null };
  if (user.passwordHash) return { provisioned: false, hint: null, temporaryPassword: null };
  const resolved = resolveInitialPasswordByPolicy(store, {
    phoneNormalized: normalizePhone(phoneCandidate || user.phoneNormalized || user.phone),
  });
  user.passwordHash = hashPassword(resolved.password);
  user.mustChangePassword = getSecuritySettings(store).forcePasswordChangeOnFirstLogin !== false;
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.updatedAt = nowIso();
  return {
    provisioned: true,
    hint: resolved.hint,
    temporaryPassword:
      resolved.mode === "random" || resolved.mode === "random_fallback" ? resolved.password : null,
  };
}

function migratePointTimeConversionRuleShape(rule) {
  rule.pointAmount = Math.max(1, Number(rule.pointAmount || 1));
  rule.minutes = Math.max(1, Number(rule.minutes || 1));
  rule.isActive = rule.isActive !== false;
  if (!rule.createdAt) rule.createdAt = nowIso();
  if (!rule.updatedAt) rule.updatedAt = rule.createdAt;
}

function resolveActivePointTimeRule(store) {
  return (
    store.pointTimeConversionRules.find((rule) => rule.isActive) ||
    store.pointTimeConversionRules[0] || { pointAmount: 1, minutes: 1 }
  );
}

function convertPointsToMinutes(pointsBalance, rule) {
  const points = Math.max(0, Number(pointsBalance || 0));
  const pointAmount = Math.max(1, Number(rule?.pointAmount || 1));
  const minutes = Math.max(1, Number(rule?.minutes || 1));
  return Math.floor((points / pointAmount) * minutes);
}

function ensureNotices(store) {
  if (store.notices.length > 0) return;
  const now = nowIso();
  store.notices = [
    {
      id: newId(),
      title: "ベータ運営のお知らせ",
      summary: "現在はベータ運営期間です。運用中のご案内事項をお知らせします。",
      content: "現在はベータ運営期間です。ご不便があれば教室までお知らせください。",
      isImportant: true,
      isActive: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      title: "予約変更ポリシー",
      summary: "予約変更・キャンセルの締切ルールに関するご案内です。",
      content: "予約の変更・キャンセルは締切前まで学生本人が処理できます。",
      isImportant: false,
      isActive: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function migrateNoticeShape(notice) {
  notice.title = String(notice.title || "").trim() || "Untitled notice";
  notice.summary = String(notice.summary || "").trim();
  notice.content = String(notice.content || "").trim();
  notice.isImportant = notice.isImportant === true;
  notice.isActive = notice.isActive !== false;
  if (!notice.publishedAt) {
    notice.publishedAt = notice.isActive ? notice.updatedAt || notice.createdAt || nowIso() : null;
  }
  if (!notice.createdAt) notice.createdAt = nowIso();
  if (!notice.updatedAt) notice.updatedAt = notice.createdAt;
}

function ensureReservationSlots(store) {
  if (store.reservationSlots.length > 0) return;

  const defaultTimes = ["10:00", "11:00", "14:00", "15:00", "16:00", "19:00"];
  const now = nowIso();
  const slots = [];

  for (let dayOffset = 0; dayOffset < 28; dayOffset += 1) {
    const dateValue = makeIsoDate(dayOffset);
    const dateObj = new Date(`${dateValue}T00:00:00`);
    const day = dateObj.getDay();
    if (day === 0) continue; // keep Sundays closed by default

    defaultTimes.forEach((time) => {
      const lessonMode = "one_on_one";
      slots.push({
        id: newId(),
        date: dateValue,
        time,
        durationMinutes: 50,
        lessonMode,
        capacity: defaultCapacityForLessonMode(lessonMode),
        instructorUserId: null,
        status: "open",
        memo: "",
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  store.reservationSlots = slots;
}

function migrateSlotShape(slot) {
  slot.lessonMode = normalizeLessonMode(slot.lessonMode || "one_on_one");
  slot.instructorUserId = normalizeInstructorUserId(slot.instructorUserId);
  if (slot.capacity === undefined || slot.capacity === null || Number(slot.capacity) <= 0) {
    slot.capacity = defaultCapacityForLessonMode(slot.lessonMode);
  } else {
    slot.capacity = Number(slot.capacity);
  }
}

function minutesToClock(minutes) {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Number(minutes || 0)));
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function roundUpToFive(minutes) {
  const value = Math.max(0, Number(minutes || 0));
  return Math.ceil(value / 5) * 5;
}

function buildGeneratedSlots(store, dateValue, mode) {
  ensureReservationPolicy(store);
  ensureSystemSettings(store);
  const policy = store.reservationPolicy;
  const durations = normalizeCourseDurations(policy.courseDurations);
  const useClassroom = policy.useClassroomHoursForSlotGeneration !== false;
  let workIntervals = [];
  let dayBreaks = [];
  if (useClassroom) {
    const sched = getClassroomDaySchedule(store.systemSettings?.classroomOperations, dateValue);
    if (sched.closed) return [];
    workIntervals = sched.workIntervals || [];
    dayBreaks = sched.breaks || [];
  } else {
    const startMin = timeToMinutes(policy.operatingStartTime);
    const endMin = timeToMinutes(policy.operatingEndTime);
    if (endMin > startMin) workIntervals = [{ startMin, endMin }];
  }
  if (workIntervals.length === 0) return [];

  const now = nowIso();
  const slots = [];

  const reservationWindows = store.reservations
    .filter((item) => item.date === dateValue && isActiveReservationStatus(item.status))
    .map((item) => ({
      start: timeToMinutes(item.time),
      end: timeToMinutes(item.time) + Number(item.durationMinutes || 0),
    }))
    .sort((a, b) => a.start - b.start);

  const pushSlot = (timeMin, durationMinutes) => {
    const endLesson = timeMin + durationMinutes;
    if (!lessonInsideWorkWindow(timeMin, endLesson, workIntervals)) return;
    if (lessonOverlapsBreak(timeMin, endLesson, dayBreaks)) return;
    slots.push({
      id: newId(),
      date: dateValue,
      time: minutesToClock(timeMin),
      durationMinutes,
      lessonMode: "one_on_one",
      capacity: defaultCapacityForLessonMode("one_on_one"),
      instructorUserId: null,
      status: "open",
      memo: "auto_generated",
      createdAt: now,
      updatedAt: now,
    });
  };

  if (mode === "all_times") {
    durations.forEach((duration) => {
      workIntervals.forEach((w) => {
        for (let cursor = w.startMin; cursor + duration <= w.endMin; cursor += 5) {
          if (lessonOverlapsBreak(cursor, cursor + duration, dayBreaks)) continue;
          pushSlot(cursor, duration);
        }
      });
    });
    return slots;
  }

  if (mode === "course_auto") {
    const prep = Math.max(0, Number(policy.prepMinutes || 0));
    durations.forEach((duration) => {
      workIntervals.forEach((w) => {
        let cursor = w.startMin;
        while (cursor + duration <= w.endMin) {
          if (lessonOverlapsBreak(cursor, cursor + duration, dayBreaks)) {
            cursor += 5;
            continue;
          }
          const overlap = reservationWindows.find((window) => cursor < window.end && window.start < cursor + duration);
          if (overlap) {
            cursor = roundUpToFive(overlap.end + prep);
            continue;
          }
          pushSlot(cursor, duration);
          cursor += duration + prep;
        }
      });
    });
  }

  return slots;
}

function findOrCreateSlotForReservation(store, reservation) {
  const existing = store.reservationSlots.find(
    (slot) =>
      slot.date === reservation.date &&
      slot.time === reservation.time &&
      Number(slot.durationMinutes || 50) === Number(reservation.durationMinutes || 50)
  );
  if (existing) return existing;

  const now = nowIso();
  const slot = {
    id: newId(),
    date: reservation.date,
    time: reservation.time,
    durationMinutes: Number(reservation.durationMinutes || 50),
    lessonMode: normalizeLessonMode(reservation.slotLessonMode || "one_on_one"),
    capacity: defaultCapacityForLessonMode(reservation.slotLessonMode || "one_on_one"),
    instructorUserId: normalizeInstructorUserId(reservation.instructorUserId),
    status: "open",
    memo: "auto-generated from existing reservation",
    createdAt: now,
    updatedAt: now,
  };
  store.reservationSlots.push(slot);
  return slot;
}

function migrateReservationShape(store, reservation) {
  if (!reservation.history) reservation.history = [];
  if (!reservation.createdAt) reservation.createdAt = nowIso();
  if (!reservation.updatedAt) reservation.updatedAt = reservation.createdAt;
  if (!reservation.status) reservation.status = "requested";
  if (!reservation.memo) reservation.memo = "";
  if (!reservation.createdByRole) reservation.createdByRole = "student";
  if (!reservation.createdByUserId) reservation.createdByUserId = null;
  if (!reservation.cancelledAt) reservation.cancelledAt = null;
  if (!reservation.cancelledByRole) reservation.cancelledByRole = null;
  if (!reservation.cancelledByUserId) reservation.cancelledByUserId = null;
  reservation.lessonDeliveryType = normalizeLessonDeliveryType(
    reservation.lessonDeliveryType || "in_person"
  );
  reservation.attendanceStatus = normalizeAttendanceStatus(reservation.attendanceStatus || "scheduled");
  if (!reservation.attendanceMarkedAt) reservation.attendanceMarkedAt = null;
  if (!reservation.attendanceMarkedByRole) reservation.attendanceMarkedByRole = null;
  if (!reservation.attendanceMarkedByUserId) reservation.attendanceMarkedByUserId = null;
  if (!reservation.lessonMinutesDeducted) reservation.lessonMinutesDeducted = 0;
  if (!reservation.lessonMinutesDeductedAt) reservation.lessonMinutesDeductedAt = null;
  if (!reservation.lessonMinutesDeductedByRole) reservation.lessonMinutesDeductedByRole = null;
  if (!reservation.lessonMinutesDeductedByUserId) reservation.lessonMinutesDeductedByUserId = null;
  if (!reservation.lessonUnitId) reservation.lessonUnitId = reservation.id || null;
  if (!reservation.pairLinkId) reservation.pairLinkId = null;
  reservation.lessonGroupType = normalizeLessonGroupType(
    reservation.lessonGroupType,
    reservation.slotLessonMode || "one_on_one"
  );

  if (reservation.lessonServiceId === undefined) reservation.lessonServiceId = null;
  if (reservation.lessonServiceNameJa === undefined) reservation.lessonServiceNameJa = null;
  if (reservation.expectedPointsConsume === undefined) reservation.expectedPointsConsume = null;
  if (reservation.pointsCharged === undefined) reservation.pointsCharged = null;

  if (!reservation.slotId || !findSlotById(store, reservation.slotId)) {
    const slot = findOrCreateSlotForReservation(store, reservation);
    reservation.slotId = slot.id;
  }
  const slot = findSlotById(store, reservation.slotId);
  if (slot) {
    reservation.slotStatus = slot.status;
    reservation.slotLessonMode = normalizeLessonMode(slot.lessonMode || "one_on_one");
    reservation.instructorUserId = normalizeInstructorUserId(slot.instructorUserId);
    reservation.instructorName = resolveInstructorName(store, reservation.instructorUserId);
  }

  if (reservation.history.length === 0) {
    reservation.history.push({
      id: newId(),
      at: reservation.createdAt,
      action: "created",
      actorRole: reservation.createdByRole,
      actorUserId: reservation.createdByUserId,
      summary: "Reservation created",
      meta: {},
    });
  }
}

function isActiveReservationStatus(status) {
  const value = String(status || "").trim();
  return value !== "cancelled" && value !== "rejected";
}

function timeToMinutes(time) {
  const [hh, mm] = String(time || "00:00")
    .split(":")
    .map((v) => Number(v || 0));
  return hh * 60 + mm;
}

function isTimeOverlap(aTime, aDuration, bTime, bDuration) {
  const aStart = timeToMinutes(aTime);
  const bStart = timeToMinutes(bTime);
  const aEnd = aStart + Number(aDuration || 0);
  const bEnd = bStart + Number(bDuration || 0);
  return aStart < bEnd && bStart < aEnd;
}

function reservationStartMs(reservation) {
  return new Date(`${reservation.date}T${reservation.time}:00`).getTime();
}

function buildStudentSelfServicePolicy(reservation, settings = null) {
  const nowMs = Date.now();
  const startMs = reservationStartMs(reservation);
  const cancelCutoffMinutes = Math.max(
    0,
    Number(settings?.cancelCutoffHours !== undefined ? Number(settings.cancelCutoffHours) * 60 : STUDENT_CANCEL_CUTOFF_MINUTES)
  );
  const changeDeadlineMs = startMs - STUDENT_CHANGE_CUTOFF_MINUTES * 60 * 1000;
  const cancelDeadlineMs = startMs - cancelCutoffMinutes * 60 * 1000;

  const statusAllowsChange = ["requested", "confirmed", "change_requested"].includes(reservation.status);
  const statusAllowsCancel = ["requested", "confirmed", "change_requested"].includes(reservation.status);
  const attendanceAllowsSelfService = normalizeAttendanceStatus(
    reservation.attendanceStatus || "scheduled"
  ) === "scheduled";
  const timeAllowsChange = nowMs <= changeDeadlineMs;
  const timeAllowsCancel = nowMs <= cancelDeadlineMs;

  return {
    canStudentChange: statusAllowsChange && attendanceAllowsSelfService && timeAllowsChange,
    canStudentCancel: statusAllowsCancel && attendanceAllowsSelfService && timeAllowsCancel,
    changeCutoffMinutes: STUDENT_CHANGE_CUTOFF_MINUTES,
    cancelCutoffMinutes,
    blockedReasonChange: statusAllowsChange && attendanceAllowsSelfService
      ? timeAllowsChange
        ? null
        : "cutoff_passed"
      : attendanceAllowsSelfService
        ? "status_not_changeable"
        : "attendance_locked",
    blockedReasonCancel: statusAllowsCancel && attendanceAllowsSelfService
      ? timeAllowsCancel
        ? null
        : "cutoff_passed"
      : attendanceAllowsSelfService
        ? "status_not_cancellable"
        : "attendance_locked",
    reservationStartAt: new Date(startMs).toISOString(),
  };
}

function appendReservationHistory(reservation, { action, actorRole, actorUserId, summary, meta = {} }) {
  if (!reservation.history) reservation.history = [];
  reservation.history.push({
    id: newId(),
    at: nowIso(),
    action,
    actorRole,
    actorUserId,
    summary,
    meta,
  });
}

/**
 * 公式な時間原簿（残りは原簿集計を優先。student.lessonMinutes は表示・互換用に同期）
 * type: charge | usage | manual_adjustment
 */
function appendLessonMinuteJournal(store, entry) {
  if (!Array.isArray(store.lessonMinuteJournal)) store.lessonMinuteJournal = [];
  const row = {
    id: String(entry.id || "").trim() || newId(),
    studentId: String(entry.studentId || "").trim(),
    type: String(entry.type || "").trim(),
    minutes: Number(entry.minutes || 0),
    relatedReservationId: entry.relatedReservationId ? String(entry.relatedReservationId) : null,
    memo: String(entry.memo || "").trim(),
    createdAt: String(entry.createdAt || nowIso()),
    createdByRole: entry.createdByRole || null,
    createdByUserId: entry.createdByUserId || null,
    legacyLessonMinuteLogId: entry.legacyLessonMinuteLogId ? String(entry.legacyLessonMinuteLogId) : null,
  };
  store.lessonMinuteJournal.push(row);
  return row;
}

function journalEntriesForStudent(store, studentId) {
  const sid = String(studentId || "").trim();
  return (store.lessonMinuteJournal || []).filter((e) => String(e.studentId || "") === sid);
}

function journalHasUsageForReservation(store, reservationId) {
  const rid = String(reservationId || "").trim();
  if (!rid) return false;
  return (store.lessonMinuteJournal || []).some(
    (e) => String(e.type || "") === "usage" && String(e.relatedReservationId || "") === rid
  );
}

function applyLessonMinutesFromJournal(store, student) {
  if (!student?.id) return;
  const entries = journalEntriesForStudent(store, student.id);
  if (entries.length === 0) return;
  const s = summarizeLessonMinuteJournalEntries(entries);
  student.lessonMinutes = {
    totalMinutes: s.totalMinutes,
    usedMinutes: s.usedMinutes,
    remainingMinutes: s.remainingMinutes,
    updatedAt: nowIso(),
  };
}

/** 管理画面用・lessonMinuteJournal を種別ごとに分割（真実は原簿配列） */
function buildLessonMinuteJournalSlicesForAdmin(store, studentId) {
  const sid = String(studentId || "").trim();
  const journal = journalEntriesForStudent(store, sid)
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const summary = summarizeLessonMinuteJournalEntries(journal);
  return {
    lessonMinuteJournalSummary: summary,
    lessonMinuteJournalCharges: journal.filter((e) => String(e.type) === "charge").slice(0, 20),
    lessonMinuteJournalUsage: journal.filter((e) => String(e.type) === "usage").slice(0, 20),
    lessonMinuteJournalManual: journal.filter((e) => String(e.type) === "manual_adjustment").slice(0, 20),
  };
}

function rememberProcessedLessonMinuteOpId(store, opId) {
  const id = String(opId || "").trim();
  if (!id) return;
  if (!Array.isArray(store.processedLessonMinuteOpIds)) store.processedLessonMinuteOpIds = [];
  if (store.processedLessonMinuteOpIds.includes(id)) return;
  store.processedLessonMinuteOpIds.push(id);
  while (store.processedLessonMinuteOpIds.length > 500) {
    store.processedLessonMinuteOpIds.shift();
  }
}

function assertAdminLessonMinutePatch(patch) {
  if (patch?.lessonMinutesCreditMinutes !== undefined) {
    const c = Number(patch.lessonMinutesCreditMinutes);
    if (c < 0) throw new Error("追加分数に負の値は指定できません。");
    if (c > 0 && Math.abs(c) > LESSON_MINUTES_ADMIN_MAX_ABS_DELTA) {
      throw new Error(
        `レッスン時間の1回あたりの上限は${LESSON_MINUTES_ADMIN_MAX_ABS_DELTA}分です。分割して操作してください。`
      );
    }
  }
  if (patch?.lessonMinutesDeductMinutes !== undefined) {
    const d = Number(patch.lessonMinutesDeductMinutes);
    if (d < 0) throw new Error("減算分数に負の値は指定できません。");
    if (d > 0 && d > LESSON_MINUTES_ADMIN_MAX_ABS_DELTA) {
      throw new Error(
        `レッスン時間の1回あたりの上限は${LESSON_MINUTES_ADMIN_MAX_ABS_DELTA}分です。分割して操作してください。`
      );
    }
  }
  if (patch?.lessonMinutesAdjustMinutes !== undefined) {
    const a = Number(patch.lessonMinutesAdjustMinutes);
    if (a !== 0 && Math.abs(a) > LESSON_MINUTES_ADMIN_MAX_ABS_DELTA) {
      throw new Error(
        `レッスン時間の1回あたりの上限は${LESSON_MINUTES_ADMIN_MAX_ABS_DELTA}分です。分割して操作してください。`
      );
    }
  }
}

function journalEntryFromLessonMinuteLog(log) {
  if (!log || typeof log !== "object") return null;
  if (!log.id) log.id = newId();
  const t = String(log.type || "");
  const base = {
    id: newId(),
    studentId: String(log.studentId || ""),
    relatedReservationId: log.reservationId ? String(log.reservationId) : null,
    memo: String(log.reason || "").trim() || "",
    createdAt: String(log.at || nowIso()),
    createdByRole: log.actorRole || null,
    createdByUserId: log.actorUserId || null,
    legacyLessonMinuteLogId: String(log.id || "").trim(),
  };
  if (t === "deduction") {
    return { ...base, type: "usage", minutes: Math.abs(Number(log.minutes || 0)) };
  }
  if (t.startsWith("credit_")) {
    return { ...base, type: "charge", minutes: Math.abs(Number(log.minutes || 0)), memo: base.memo || t };
  }
  if (t === "refund") {
    const restored = Math.abs(Number(log.minutes || 0));
    return { ...base, type: "manual_adjustment", minutes: restored, memo: `refund:${base.memo || "cancel"}` };
  }
  if (t === "manual_adjustment") {
    return { ...base, type: "manual_adjustment", minutes: Number(log.minutes || 0) };
  }
  if (t === "debit_manual_adjustment") {
    return { ...base, type: "manual_adjustment", minutes: Number(log.minutes || 0) };
  }
  return null;
}

function ensureLessonMinuteJournalFromLogs(store) {
  if (!Array.isArray(store.lessonMinuteJournal)) store.lessonMinuteJournal = [];
  if (store.lessonMinuteJournalBackfilledFromLogs) return;
  const seen = new Set(
    (store.lessonMinuteJournal || [])
      .map((e) => String(e.legacyLessonMinuteLogId || "").trim())
      .filter(Boolean)
  );
  for (const log of store.lessonMinuteLogs || []) {
    if (!log || typeof log !== "object") continue;
    if (!log.id) log.id = newId();
    const lid = String(log.id);
    if (seen.has(lid)) continue;
    const row = journalEntryFromLessonMinuteLog(log);
    if (row) {
      appendLessonMinuteJournal(store, row);
      seen.add(lid);
    }
  }
  store.lessonMinuteJournalBackfilledFromLogs = true;
}

/**
 * 正規化された内部原簿（charge/topup・usage・manual・refund）。lessonMinuteLogs と二重記録し、監査用。
 * kind: topup | usage | refund | manual_adjustment
 * minutesDelta: 残り時間への効果（+ 付与 / − 消費）
 */
function lessonMinuteLedgerKindFromLogType(type) {
  const t = String(type || "");
  if (t === "deduction") return "usage";
  if (t === "refund") return "refund";
  if (t.startsWith("credit_")) return "topup";
  return "manual_adjustment";
}

function lessonMinuteLedgerDeltaFromLog(log) {
  const t = String(log?.type || "");
  const m = Number(log?.minutes || 0);
  if (t === "deduction") return -Math.abs(m);
  if (t === "refund") return Math.max(0, -m);
  if (t.startsWith("credit_")) return Math.abs(m);
  return m;
}

function appendLessonMinuteLedgerEntry(store, log, extraMeta = {}) {
  if (!Array.isArray(store.lessonMinuteLedger)) store.lessonMinuteLedger = [];
  const lid = String(log?.id || "").trim() || newId();
  if (!log.id) log.id = lid;
  store.lessonMinuteLedger.push({
    id: newId(),
    at: String(log.at || nowIso()),
    studentId: String(log.studentId || ""),
    kind: lessonMinuteLedgerKindFromLogType(log.type),
    minutesDelta: lessonMinuteLedgerDeltaFromLog(log),
    balanceAfterRemaining:
      log.afterRemainingMinutes === undefined || log.afterRemainingMinutes === null
        ? null
        : Number(log.afterRemainingMinutes),
    reservationId: log.reservationId ? String(log.reservationId) : null,
    lessonMinuteLogId: String(log.id || lid),
    reason: String(log.reason || "").trim(),
    actorRole: log.actorRole || null,
    actorUserId: log.actorUserId || null,
    meta: typeof extraMeta === "object" && extraMeta ? extraMeta : {},
  });
}

function ensureLessonMinuteLedgerBackfill(store) {
  if (!Array.isArray(store.lessonMinuteLedger)) store.lessonMinuteLedger = [];
  if (store.lessonMinuteLedgerBackfilled) return;
  const seen = new Set(
    store.lessonMinuteLedger.map((e) => String(e.lessonMinuteLogId || "").trim()).filter(Boolean)
  );
  for (const log of store.lessonMinuteLogs || []) {
    if (!log || typeof log !== "object") continue;
    if (!log.id) log.id = newId();
    const lid = String(log.id);
    if (seen.has(lid)) continue;
    appendLessonMinuteLedgerEntry(store, log, { source: "backfill" });
    seen.add(lid);
  }
  store.lessonMinuteLedgerBackfilled = true;
}

function applyLessonMinuteDeduction(store, reservation, actor = null) {
  if (!reservation) return;
  if (reservation.status === "cancelled") return;
  if (Number(reservation.lessonMinutesDeducted || 0) > 0) return;
  if (journalHasUsageForReservation(store, reservation.id)) return;

  const student = store.students.find((item) => item.id === reservation.studentId);
  if (!student) return;
  migrateStudentShape(student);
  applyLessonMinutesFromJournal(store, student);

  const minutes = Math.max(0, Number(reservation.durationMinutes || 0));
  if (minutes <= 0) return;

  const entriesBefore = journalEntriesForStudent(store, student.id);
  const beforeRemaining = entriesBefore.length
    ? summarizeLessonMinuteJournalEntries(entriesBefore).remainingMinutes
    : Number(student.lessonMinutes.remainingMinutes || 0);

  const deductionLogId = newId();
  const ts = nowIso();
  const journalRow = appendLessonMinuteJournal(store, {
    studentId: student.id,
    type: "usage",
    minutes,
    relatedReservationId: reservation.id,
    memo: `usage:reservation:${reservation.id}`,
    createdAt: ts,
    createdByRole: actor?.role || "admin",
    createdByUserId: actor?.userId || null,
    legacyLessonMinuteLogId: deductionLogId,
  });

  applyLessonMinutesFromJournal(store, student);
  student.updatedAt = student.lessonMinutes.updatedAt;

  const afterRemaining = Number(student.lessonMinutes.remainingMinutes || 0);
  const shortfall = minutes > beforeRemaining;

  reservation.lessonMinutesDeducted = minutes;
  reservation.lessonMinutesDeductedAt = student.lessonMinutes.updatedAt;
  reservation.lessonMinutesDeductedByRole = actor?.role || "admin";
  reservation.lessonMinutesDeductedByUserId = actor?.userId || null;

  const deductionLog = {
    id: deductionLogId,
    at: student.lessonMinutes.updatedAt,
    type: "deduction",
    studentId: student.id,
    reservationId: reservation.id,
    minutes,
    reason: reservation.attendanceStatus,
    actorRole: actor?.role || "admin",
    actorUserId: actor?.userId || null,
    beforeRemainingMinutes: beforeRemaining,
    afterRemainingMinutes: afterRemaining,
  };
  store.lessonMinuteLogs.push(deductionLog);
  appendLessonMinuteLedgerEntry(store, deductionLog, {
    trigger: reservation.status === "completed" ? "completion" : "attended_legacy",
    shortfall,
    shortfallMinutes: shortfall ? minutes - beforeRemaining : 0,
  });
  appendPaymentEvent(store, {
    at: student.lessonMinutes.updatedAt,
    eventType: "USAGE",
    studentId: student.id,
    transactionId: null,
    relatedTransactionId: reservation.id,
    reason: `reservation_usage:${reservation.id}`,
    actorRole: actor?.role || "admin",
    actorUserId: actor?.userId || null,
    payloadSnapshot: {
      reservationId: reservation.id,
      minutes,
      attendanceStatus: reservation.attendanceStatus || null,
    },
    resultSnapshot: buildEventResultSnapshot(student),
  });

  writeAuditLog(store, {
    actorUserId: actor?.userId || null,
    actorRole: actor?.role || "admin",
    action: "reservation.lesson_minutes_deducted",
    targetType: "reservation",
    targetId: reservation.id,
    summary: `Lesson minutes deducted for reservation ${reservation.id}`,
    meta: {
      studentId: student.id,
      minutes,
      beforeRemainingMinutes: beforeRemaining,
      afterRemainingMinutes: student.lessonMinutes.remainingMinutes,
      shortfall,
      shortfallMinutes: shortfall ? minutes - beforeRemaining : 0,
      lessonMinuteJournalEntryId: journalRow?.id || null,
    },
  });
  if (shortfall) {
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.lesson_minutes_shortfall",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `Lesson minutes deduction exceeded remaining balance (reservation ${reservation.id})`,
      meta: {
        studentId: student.id,
        minutes,
        beforeRemainingMinutes: beforeRemaining,
      },
    });
  }
}

function applyLessonMinuteRefundForCancellation(store, reservation, actor = null, policySource = "admin") {
  if (!reservation) return;
  if (Number(reservation.lessonMinutesDeducted || 0) <= 0) return;
  const student = store.students.find((item) => item.id === reservation.studentId);
  if (!student) return;
  migrateStudentShape(student);
  applyLessonMinutesFromJournal(store, student);

  const refundMinutes = Number(reservation.lessonMinutesDeducted || 0);
  const entriesBefore = journalEntriesForStudent(store, student.id);
  const beforeRemaining = entriesBefore.length
    ? summarizeLessonMinuteJournalEntries(entriesBefore).remainingMinutes
    : Number(student.lessonMinutes.remainingMinutes || 0);

  const refundLogId = newId();
  const ts = nowIso();
  appendLessonMinuteJournal(store, {
    studentId: student.id,
    type: "manual_adjustment",
    minutes: refundMinutes,
    relatedReservationId: reservation.id,
    memo: `refund_cancel:${policySource}:${reservation.id}`,
    createdAt: ts,
    createdByRole: actor?.role || "admin",
    createdByUserId: actor?.userId || null,
    legacyLessonMinuteLogId: refundLogId,
  });
  applyLessonMinutesFromJournal(store, student);
  student.updatedAt = student.lessonMinutes.updatedAt;

  const refundLog = {
    id: refundLogId,
    at: student.lessonMinutes.updatedAt,
    type: "refund",
    studentId: student.id,
    reservationId: reservation.id,
    minutes: -refundMinutes,
    reason: `${policySource}_cancel`,
    actorRole: actor?.role || "admin",
    actorUserId: actor?.userId || null,
    beforeRemainingMinutes: beforeRemaining,
    afterRemainingMinutes: student.lessonMinutes.remainingMinutes,
  };
  store.lessonMinuteLogs.push(refundLog);
  appendLessonMinuteLedgerEntry(store, refundLog, { policySource });
  appendPaymentEvent(store, {
    at: student.lessonMinutes.updatedAt,
    eventType: "REFUND",
    studentId: student.id,
    transactionId: null,
    relatedTransactionId: reservation.id,
    reason: `${policySource}_cancel`,
    actorRole: actor?.role || "admin",
    actorUserId: actor?.userId || null,
    payloadSnapshot: {
      reservationId: reservation.id,
      refundMinutes,
      policySource,
    },
    resultSnapshot: buildEventResultSnapshot(student),
  });

  reservation.lessonMinutesDeducted = 0;
  reservation.lessonMinutesDeductedAt = null;
  reservation.lessonMinutesDeductedByRole = null;
  reservation.lessonMinutesDeductedByUserId = null;
}

function applyStudentLessonMinuteManualAdjustment(store, student, deltaMinutes, actor = null, reason = "") {
  migrateStudentShape(student);
  applyLessonMinutesFromJournal(store, student);
  const entriesBefore = journalEntriesForStudent(store, student.id);
  const beforeRemaining = entriesBefore.length
    ? summarizeLessonMinuteJournalEntries(entriesBefore).remainingMinutes
    : Number(student.lessonMinutes.remainingMinutes || 0);
  const beforeTotal = Number(student.lessonMinutes.totalMinutes || 0);

  const manualLogId = newId();
  const ts = nowIso();
  appendLessonMinuteJournal(store, {
    studentId: student.id,
    type: "manual_adjustment",
    minutes: Number(deltaMinutes || 0),
    relatedReservationId: null,
    memo: String(reason || "manual_adjustment").trim() || "manual_adjustment",
    createdAt: ts,
    createdByRole: actor?.role || "admin",
    createdByUserId: actor?.userId || null,
    legacyLessonMinuteLogId: manualLogId,
  });
  applyLessonMinutesFromJournal(store, student);
  student.updatedAt = student.lessonMinutes.updatedAt;

  const manualLog = {
    id: manualLogId,
    at: student.lessonMinutes.updatedAt,
    type: "manual_adjustment",
    studentId: student.id,
    reservationId: null,
    minutes: deltaMinutes,
    reason: String(reason || "manual_adjustment").trim() || "manual_adjustment",
    actorRole: actor?.role || "admin",
    actorUserId: actor?.userId || null,
    beforeRemainingMinutes: beforeRemaining,
    afterRemainingMinutes: student.lessonMinutes.remainingMinutes,
  };
  store.lessonMinuteLogs.push(manualLog);
  appendLessonMinuteLedgerEntry(store, manualLog, {});

  writeAuditLog(store, {
    actorUserId: actor?.userId || null,
    actorRole: actor?.role || "admin",
    action: "student.lesson_minutes_adjusted",
    targetType: "student",
    targetId: student.id,
    summary: `Admin adjusted lesson minutes for ${student.email}`,
    meta: {
      deltaMinutes,
      reason,
      beforeTotal,
      afterTotal: student.lessonMinutes.totalMinutes,
      beforeRemaining,
      afterRemaining: student.lessonMinutes.remainingMinutes,
    },
  });
}

function normalizeLessonMinuteCreditType(value) {
  const raw = String(value || "").trim();
  const allowed = new Set(["purchase", "admin_grant", "manual_adjustment"]);
  return allowed.has(raw) ? raw : "admin_grant";
}

function applyStudentLessonMinuteCredit(
  store,
  student,
  creditMinutes,
  actor = null,
  creditType = "admin_grant",
  reason = "",
  packageInfo = null
) {
  migrateStudentShape(student);
  applyLessonMinutesFromJournal(store, student);
  const minutes = Math.max(0, Number(creditMinutes || 0));
  if (minutes <= 0) return;

  const entriesBefore = journalEntriesForStudent(store, student.id);
  const beforeRemaining = entriesBefore.length
    ? summarizeLessonMinuteJournalEntries(entriesBefore).remainingMinutes
    : Number(student.lessonMinutes.remainingMinutes || 0);
  const beforeTotal = Number(student.lessonMinutes.totalMinutes || 0);
  const normalizedType = normalizeLessonMinuteCreditType(creditType);
  const packageId = packageInfo?.id || null;
  const packageName = packageInfo?.name || null;
  const packageMinutes = packageInfo?.minutes ? Number(packageInfo.minutes) : null;

  const creditLogId = newId();
  const memoParts = [
    String(reason || normalizedType).trim() || normalizedType,
    packageName ? `pkg:${packageName}` : "",
  ].filter(Boolean);
  appendLessonMinuteJournal(store, {
    studentId: student.id,
    type: "charge",
    minutes,
    relatedReservationId: null,
    memo: memoParts.join(" | "),
    createdAt: nowIso(),
    createdByRole: actor?.role || "admin",
    createdByUserId: actor?.userId || null,
    legacyLessonMinuteLogId: creditLogId,
  });
  applyLessonMinutesFromJournal(store, student);
  student.updatedAt = student.lessonMinutes.updatedAt;

  const creditLog = {
    id: creditLogId,
    at: student.lessonMinutes.updatedAt,
    type: `credit_${normalizedType}`,
    studentId: student.id,
    reservationId: null,
    minutes,
    reason: String(reason || normalizedType).trim() || normalizedType,
    packageId,
    packageName,
    packageMinutes,
    actorRole: actor?.role || "admin",
    actorUserId: actor?.userId || null,
    beforeRemainingMinutes: beforeRemaining,
    afterRemainingMinutes: student.lessonMinutes.remainingMinutes,
  };
  store.lessonMinuteLogs.push(creditLog);
  appendLessonMinuteLedgerEntry(store, creditLog, { creditType: normalizedType });

  writeAuditLog(store, {
    actorUserId: actor?.userId || null,
    actorRole: actor?.role || "admin",
    action: "student.lesson_minutes_credited",
    targetType: "student",
    targetId: student.id,
    summary: `Admin credited lesson minutes for ${student.email}`,
    meta: {
      creditType: normalizedType,
      minutes,
      reason,
      packageId,
      packageName,
      packageMinutes,
      beforeTotal,
      afterTotal: student.lessonMinutes.totalMinutes,
      beforeRemaining,
      afterRemaining: student.lessonMinutes.remainingMinutes,
    },
  });
}

/**
 * 決済調整で付与分を戻す（残り時間・合計から減算。既存取引は変更しない）
 */
function applyStudentLessonMinuteDebit(store, student, debitMinutes, actor = null, reason = "", transactionId = null) {
  const dm = Math.max(0, Math.floor(Number(debitMinutes || 0)));
  if (dm <= 0) return;
  migrateStudentShape(student);
  applyLessonMinutesFromJournal(store, student);
  const entriesBefore = journalEntriesForStudent(store, student.id);
  const beforeRem = entriesBefore.length
    ? summarizeLessonMinuteJournalEntries(entriesBefore).remainingMinutes
    : Number(student.lessonMinutes.remainingMinutes || 0);
  const dec = Math.min(dm, beforeRem);
  if (dm > beforeRem && beforeRem >= 0) {
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "student.lesson_minutes_admin_deduct_capped",
      targetType: "student",
      targetId: student.id,
      summary: `Admin deduct requested ${dm}m but only ${beforeRem}m applied (${student.email})`,
      meta: {
        requestedMinutes: dm,
        appliedMinutes: dec,
        beforeRemainingMinutes: beforeRem,
        reason: String(reason || "").trim(),
        transactionId: transactionId || null,
      },
    });
  }

  const debitLogId = newId();
  appendLessonMinuteJournal(store, {
    studentId: student.id,
    type: "manual_adjustment",
    minutes: -dec,
    relatedReservationId: null,
    memo: String(reason || "manual_debit").trim() || `manual_debit:${transactionId || ""}`,
    createdAt: nowIso(),
    createdByRole: actor?.role || "admin",
    createdByUserId: actor?.userId || null,
    legacyLessonMinuteLogId: debitLogId,
  });
  applyLessonMinutesFromJournal(store, student);
  student.updatedAt = student.lessonMinutes.updatedAt;

  const debitLog = {
    id: debitLogId,
    at: student.lessonMinutes.updatedAt,
    type: "debit_manual_adjustment",
    studentId: student.id,
    reservationId: null,
    minutes: -dec,
    reason: String(reason || "manual_debit").trim() || "manual_debit",
    packageId: transactionId || null,
    packageName: "adjustment",
    packageMinutes: dec,
    actorRole: actor?.role || "admin",
    actorUserId: actor?.userId || null,
    beforeRemainingMinutes: beforeRem,
    afterRemainingMinutes: student.lessonMinutes.remainingMinutes,
  };
  store.lessonMinuteLogs.push(debitLog);
  appendLessonMinuteLedgerEntry(store, debitLog, { transactionId });

  writeAuditLog(store, {
    actorUserId: actor?.userId || null,
    actorRole: actor?.role || "admin",
    action: "student.lesson_minutes_debited",
    targetType: "student",
    targetId: student.id,
    summary: transactionId
      ? `Debit lesson minutes for adjustment ${transactionId}`
      : `Admin panel lesson minute deduct (${dec}m) for ${student.email}`,
    meta: {
      minutes: dec,
      reason,
      transactionId,
      sourceAdminPanel: !transactionId,
      requestedMinutes: dm,
      appliedMinutes: dec,
    },
  });
}

function findSlotById(store, slotId) {
  return store.reservationSlots.find((slot) => slot.id === slotId) || null;
}

function findSlotByDateTime(store, date, time, durationMinutes) {
  return (
    store.reservationSlots.find(
      (slot) =>
        slot.date === date &&
        slot.time === time &&
        Number(slot.durationMinutes) === Number(durationMinutes || 50)
    ) || null
  );
}

function countActiveReservationsInSlot(store, slotId, excludeReservationId = null) {
  return store.reservations.filter(
    (reservation) =>
      reservation.slotId === slotId &&
      reservation.id !== excludeReservationId &&
      isActiveReservationStatus(reservation.status)
  ).length;
}

function validateStudentConflict(store, studentId, date, time, durationMinutes, excludeReservationId = null) {
  const conflicting = store.reservations.find((reservation) => {
    if (reservation.id === excludeReservationId) return false;
    if (reservation.studentId !== studentId) return false;
    if (!isActiveReservationStatus(reservation.status)) return false;
    if (reservation.date !== date) return false;
    return isTimeOverlap(reservation.time, reservation.durationMinutes, time, durationMinutes);
  });

  return conflicting
    ? { ok: false, reason: "student_conflict", reservationId: conflicting.id }
    : { ok: true };
}

function validateOperationConflict(store, slot, excludeReservationId = null) {
  const slotStartMs = new Date(`${slot.date}T${slot.time}:00`).getTime();
  if (slotStartMs <= Date.now()) {
    return { ok: false, reason: "slot_started" };
  }

  if (slot.status !== "open") {
    return { ok: false, reason: "slot_closed" };
  }

  const activeCount = countActiveReservationsInSlot(store, slot.id, excludeReservationId);
  if (activeCount >= Number(slot.capacity || 1)) {
    return { ok: false, reason: "operation_conflict", activeCount };
  }

  return { ok: true };
}

function reservationSortDesc(a, b) {
  const left = `${a.date || ""} ${a.time || ""}`.trim();
  const right = `${b.date || ""} ${b.time || ""}`.trim();
  return right.localeCompare(left);
}

function nextReservationSortAsc(a, b) {
  const left = `${a.date || ""} ${a.time || ""}`.trim();
  const right = `${b.date || ""} ${b.time || ""}`.trim();
  return left.localeCompare(right);
}

function toReservationDto(reservation, student = null, user = null) {
  const policy = buildStudentSelfServicePolicy(reservation);
  return {
    id: reservation.id,
    studentId: reservation.studentId,
    date: reservation.date,
    time: reservation.time,
    durationMinutes: reservation.durationMinutes,
    status: reservation.status,
    lessonDeliveryType: normalizeLessonDeliveryType(reservation.lessonDeliveryType || "in_person"),
    memo: reservation.memo,
    createdByRole: reservation.createdByRole,
    createdByUserId: reservation.createdByUserId,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    studentNameKanji: student?.nameKanji || null,
    studentNameFurigana: student?.nameFurigana || null,
    studentNumber: student?.studentNumber || null,
    studentEmail: student?.email || null,
    linkedUserEmail: user?.email || null,
    slotId: reservation.slotId || null,
    slotStatus: reservation.slotStatus || null,
    slotLessonMode: normalizeLessonMode(reservation.slotLessonMode || "one_on_one"),
    lessonGroupType: normalizeLessonGroupType(
      reservation.lessonGroupType,
      reservation.slotLessonMode || "one_on_one"
    ),
    isPairLesson:
      normalizeLessonGroupType(reservation.lessonGroupType, reservation.slotLessonMode || "one_on_one") === "pair",
    instructorUserId: normalizeInstructorUserId(reservation.instructorUserId),
    instructorName: reservation.instructorName || null,
    cancelledAt: reservation.cancelledAt || null,
    cancelledByRole: reservation.cancelledByRole || null,
    cancelledByUserId: reservation.cancelledByUserId || null,
    attendanceStatus: normalizeAttendanceStatus(reservation.attendanceStatus || "scheduled"),
    attendanceMarkedAt: reservation.attendanceMarkedAt || null,
    attendanceMarkedByRole: reservation.attendanceMarkedByRole || null,
    attendanceMarkedByUserId: reservation.attendanceMarkedByUserId || null,
    lessonMinutesDeducted: Number(reservation.lessonMinutesDeducted || 0),
    lessonMinutesDeductedAt: reservation.lessonMinutesDeductedAt || null,
    lessonMinutesDeductedByRole: reservation.lessonMinutesDeductedByRole || null,
    lessonMinutesDeductedByUserId: reservation.lessonMinutesDeductedByUserId || null,
    lessonUnitId: reservation.lessonUnitId || null,
    pairLinkId: reservation.pairLinkId || null,
    history: reservation.history || [],
    selfService: policy,
    lessonServiceId: reservation.lessonServiceId || null,
    lessonServiceNameJa: reservation.lessonServiceNameJa || null,
    expectedPointsConsume:
      reservation.expectedPointsConsume != null ? Number(reservation.expectedPointsConsume) : null,
    pointsCharged: reservation.pointsCharged != null ? Number(reservation.pointsCharged) : null,
  };
}

function filterReservations(items, filters = {}) {
  const status = String(filters?.status || "").trim();
  const studentId = String(filters?.studentId || "").trim();
  const lessonMode = String(filters?.lessonMode || "").trim();
  const fromDate = normalizeReservationDate(filters?.fromDate || "");
  const toDate = normalizeReservationDate(filters?.toDate || "");
  const q = String(filters?.q || "").trim().toLowerCase();

  return items.filter((item) => {
    if (status && item.status !== status) return false;
    if (studentId && item.studentId !== studentId) return false;
    if (lessonMode && normalizeLessonMode(item.slotLessonMode || "one_on_one") !== normalizeLessonMode(lessonMode)) {
      return false;
    }
    if (fromDate && item.date < fromDate) return false;
    if (toDate && item.date > toDate) return false;
    if (q) {
      const haystack = [
        item.memo,
        item.studentNameKanji,
        item.studentNameFurigana,
        item.studentNumber,
        item.studentEmail,
        item.linkedUserEmail,
        item.instructorName,
        item.lessonGroupType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function requestLoginLink({
  email,
  baseUrl,
  nextPath = "/login/next",
  requestIp = null,
  userAgent = null,
  role = null,
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    cleanExpired(store);

    const user = ensureUser(store, {
      email: normalizedEmail,
      role,
    });
    if (user.role === "parent" && store.systemSettings?.parent?.parentAccountEnabled === false) {
      await writeStore(store);
      throw new Error("保護者アカウント機能が無効化されています。");
    }
    const { rawToken, token } = createLoginToken(store, {
      user,
      email: normalizedEmail,
      requestIp,
      userAgent,
      nextPath,
    });

    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.request_link",
      targetType: "user",
      targetId: user.id,
      summary: `Login link requested for ${user.email}`,
      meta: { nextPath },
    });

    await writeStore(store);

    const safeNext = String(nextPath || "/login/next").startsWith("/")
      ? String(nextPath || "/login/next")
      : "/login/next";
    const loginUrl = `${baseUrl}/api/auth/verify?token=${rawToken}&next=${encodeURIComponent(
      safeNext
    )}`;

    return {
      loginUrl,
      expiresAt: token.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  });
}

export async function startStudentRegistration({
  email,
  nameKanji,
  nameFurigana,
  baseUrl,
  requestIp = null,
  userAgent = null,
}) {
  const normalizedEmail = normalizeEmail(email);
  const cleanKanji = String(nameKanji || "").trim();
  const cleanFurigana = String(nameFurigana || "").trim();
  if (!normalizedEmail || !cleanKanji || !cleanFurigana) {
    throw new Error("Required fields are missing");
  }

  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);
    const ts = nowIso();

    const user = ensureUser(store, {
      email: normalizedEmail,
      role: "student",
      displayName: cleanKanji,
    });

    let student = store.students.find((item) => item.email === normalizedEmail);
    if (!student) {
      student = {
        id: newId(),
        email: normalizedEmail,
        nameKanji: cleanKanji,
        nameFurigana: cleanFurigana,
        address: "",
        birthDate: "",
        phone: "",
        extraInfo: "",
        crmProfile: {
          addressLine1: "",
          addressLine2: "",
          postalCode: "",
          birthDate: "",
          phoneMobile: "",
          phoneEmergency: "",
          emergencyContactName: "",
          emergencyContactNameFurigana: "",
          emergencyContactRelation: "",
          nameKorean: "",
          profileImageDataUrl: "",
          adminStudentTendency: "",
          adminLessonCautions: "",
          adminResponseStyle: "",
          adminLearningTraits: "",
          adminCounselMemo: "",
          notes: "",
        },
        studentNumber: null,
        lessonMinutes: {
          totalMinutes: 0,
          usedMinutes: 0,
          remainingMinutes: 0,
          updatedAt: ts,
        },
        points: {
          balance: 0,
          updatedAt: ts,
        },
        isMinor: false,
        guardianRequired: false,
        guardianMemo: "",
        registrationStatus: "start_pending_consent",
        consentStatus: "pending",
        consentAgreedAt: null,
        createdAt: ts,
        updatedAt: ts,
      };
      store.students.push(student);
    } else {
      student.nameKanji = cleanKanji;
      student.nameFurigana = cleanFurigana;
      migrateStudentShape(student);
      student.updatedAt = ts;
    }

    let link = store.userStudentLinks.find((item) => item.userId === user.id);
    if (!link) {
      link = {
        id: newId(),
        userId: user.id,
        studentId: student.id,
        linkedAt: ts,
      };
      store.userStudentLinks.push(link);
    }
    ensureInitialStudentPasswordIfPossible(store, student);

    const consentNextPath = registrationConsentPathWithDefaultUi();

    const { rawToken, token } = createLoginToken(store, {
      user,
      email: normalizedEmail,
      requestIp,
      userAgent,
      nextPath: consentNextPath,
    });

    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: user.role,
      action: "student.registration_started",
      targetType: "student",
      targetId: student.id,
      summary: `Student registration started for ${student.email}`,
      meta: { nameKanji: student.nameKanji, nameFurigana: student.nameFurigana },
    });

    await writeStore(store);
    const loginUrl = `${baseUrl}/api/auth/verify?token=${rawToken}&next=${encodeURIComponent(
      consentNextPath
    )}${verifyLinkUiQuerySuffix()}`;

    return {
      loginUrl,
      expiresAt: token.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      student: {
        id: student.id,
        registrationStatus: student.registrationStatus,
        consentStatus: student.consentStatus,
      },
    };
  });
}

export async function consumeLoginToken({
  rawToken,
  requestIp = null,
  userAgent = null,
}) {
  if (!rawToken) {
    return { ok: false, reason: "token_missing" };
  }

  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);

    const tokenHash = hashToken(rawToken);
    const token = store.loginTokens.find((t) => t.tokenHash === tokenHash);
    if (!token) {
      await writeStore(store);
      return { ok: false, reason: "token_not_found" };
    }
    if (token.usedAt) {
      await writeStore(store);
      return { ok: false, reason: "token_already_used" };
    }
    if (toMs(token.expiresAt) <= Date.now()) {
      await writeStore(store);
      return { ok: false, reason: "token_expired" };
    }

    const user = store.users.find((u) => u.id === token.userId);
    if (!user) {
      await writeStore(store);
      return { ok: false, reason: "user_not_found" };
    }

    const usedAt = nowIso();
    token.usedAt = usedAt;
    token.consumeIp = requestIp;
    token.consumeUserAgent = userAgent;
    const { rawSession } = createSessionForUser(store, user, requestIp, userAgent);

    const student = findLinkedStudent(store, user.id);
    const nextPath = token.nextPath || roleNextPath(user, student);

    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.login_success",
      targetType: "user",
      targetId: user.id,
      summary: `Login succeeded for ${user.email}`,
      meta: { nextPath },
    });

    await writeStore(store);

    return {
      ok: true,
      sessionToken: rawSession,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
      nextPath,
    };
  });
}

export async function loginWithPassword({
  loginId,
  password,
  requestIp = null,
  userAgent = null,
  role = null,
}) {
  const cleanLoginId = String(loginId || "").trim();
  const cleanPassword = String(password || "");
  if (!cleanLoginId || !cleanPassword) {
    return { ok: false, reason: "invalid_credentials", error: "ログインIDとパスワードを入力してください。" };
  }

  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    cleanExpired(store);
    const user = resolveUserByLoginId(store, cleanLoginId, role);
    const loginAttemptLimit = Math.max(
      1,
      Number(store.systemSettings?.security?.loginAttemptLimit || 5)
    );
    if (user && user.role === "parent" && store.systemSettings?.parent?.parentAccountEnabled === false) {
      await writeStore(store);
      return { ok: false, reason: "parent_disabled", error: "保護者アカウント機能が無効です。" };
    }
    if (user?.lockedUntil && toMs(user.lockedUntil) > Date.now()) {
      await writeStore(store);
      return {
        ok: false,
        reason: "account_locked",
        error: "ログイン試行回数を超過しました。しばらくしてから再試行してください。",
      };
    }
    if (!user || !user.passwordHash || !verifyPassword(cleanPassword, user.passwordHash)) {
      if (user) {
        user.failedLoginCount = Math.max(0, Number(user.failedLoginCount || 0)) + 1;
        if (user.failedLoginCount >= loginAttemptLimit) {
          user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          user.failedLoginCount = 0;
        }
        user.updatedAt = nowIso();
      }
      await writeStore(store);
      return {
        ok: false,
        reason: "invalid_credentials",
        error: "ログインIDまたはパスワードが正しくありません。",
      };
    }

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    const { rawSession } = createSessionForUser(store, user, requestIp, userAgent);
    const student = findLinkedStudent(store, user.id);
    const nextPath = roleNextPath(user, student);
    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.password_login_success",
      targetType: "user",
      targetId: user.id,
      summary: `Password login succeeded for ${user.email}`,
      meta: { nextPath },
    });
    await writeStore(store);
    return {
      ok: true,
      sessionToken: rawSession,
      nextPath,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
    };
  });
}

export async function changePasswordForUser(userId, payload = {}, options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const user = store.users.find((item) => item.id === userId);
    if (!user) return { ok: false, reason: "user_not_found", error: "ユーザーが見つかりません。" };

    const currentPassword = String(payload?.currentPassword || "");
    const newPassword = String(payload?.newPassword || "");
    const confirmPassword = String(payload?.confirmPassword || "");
    const requireCurrentPassword = options.requireCurrentPassword !== false;
    if (newPassword.length < 4) {
      return { ok: false, reason: "password_too_short", error: "新しいパスワードは4文字以上で入力してください。" };
    }
    if (newPassword !== confirmPassword) {
      return { ok: false, reason: "password_mismatch", error: "新しいパスワードの確認が一致しません。" };
    }
    if (requireCurrentPassword) {
      if (!user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
        return { ok: false, reason: "current_password_invalid", error: "現在のパスワードを確認してください。" };
      }
    }

    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.updatedAt = nowIso();
    store.passwordResetTokens = (store.passwordResetTokens || []).map((token) =>
      token.userId === user.id && !token.usedAt
        ? { ...token, usedAt: nowIso(), consumeIp: null, consumeUserAgent: "password_changed" }
        : token
    );

    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.password_changed",
      targetType: "user",
      targetId: user.id,
      summary: `Password changed for ${user.email}`,
      meta: { requireCurrentPassword },
    });

    await writeStore(store);
    return { ok: true };
  });
}

export async function requestPasswordResetByStudentIdentity({
  nameKanji,
  phone,
  email,
  requestIp = null,
  userAgent = null,
}) {
  const cleanNameKanji = String(nameKanji || "").trim();
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  if (!cleanNameKanji || !normalizedPhone || !normalizedEmail) {
    return { ok: false, error: "入力情報を確認してください。" };
  }

  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    if (store.systemSettings?.security?.allowPasswordReset === false) {
      await writeStore(store);
      return { ok: false, error: "現在、パスワード再設定は無効です。" };
    }
    cleanExpired(store);
    const nameKey = normalizeNameKanjiForMatch(cleanNameKanji);
    const student =
      store.students.find((item) => {
        const storedPhone = normalizePhone(
          item.phoneNormalized || item.phone || item?.crmProfile?.phoneMobile
        );
        const phoneOk = !storedPhone ? true : storedPhone === normalizedPhone;
        return (
          normalizeNameKanjiForMatch(item.nameKanji) === nameKey &&
          phoneOk &&
          normalizeEmail(item.email) === normalizedEmail
        );
      }) || null;
    if (!student) {
      await writeStore(store);
      return { ok: false, error: "入力情報を確認してください。" };
    }
    const user = findUserByStudentId(store, student.id);
    if (!user) {
      await writeStore(store);
      return { ok: false, error: "入力情報を確認してください。" };
    }

    const { rawToken, token } = createPasswordResetToken(store, {
      user,
      email: user.email,
      requestIp,
      userAgent,
    });
    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.password_reset_requested",
      targetType: "user",
      targetId: user.id,
      summary: `Password reset requested for ${user.email}`,
      meta: {},
    });
    await writeStore(store);
    return {
      ok: true,
      rawToken,
      expiresAt: token.expiresAt,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  });
}

export async function verifyPasswordResetToken(rawToken) {
  if (!rawToken) return { ok: false, error: "トークンが無効です。" };
  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);
    const tokenHash = hashToken(rawToken);
    const token = (store.passwordResetTokens || []).find((item) => item.tokenHash === tokenHash) || null;
    if (!token || token.usedAt || toMs(token.expiresAt) <= Date.now()) {
      await writeStore(store);
      return { ok: false, error: "再設定リンクの有効期限が切れたか、すでに使用されています。" };
    }
    await writeStore(store);
    return { ok: true, expiresAt: token.expiresAt };
  });
}

export async function consumePasswordResetTokenAndInitPassword(rawToken, consumeMeta = {}) {
  if (!rawToken) return { ok: false, error: "トークンが無効です。" };
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    cleanExpired(store);
    const tokenHash = hashToken(rawToken);
    const token = (store.passwordResetTokens || []).find((item) => item.tokenHash === tokenHash) || null;
    if (!token || token.usedAt || toMs(token.expiresAt) <= Date.now()) {
      await writeStore(store);
      return { ok: false, error: "再設定リンクの有効期限が切れたか、すでに使用されています。" };
    }
    const user = store.users.find((item) => item.id === token.userId) || null;
    if (!user) {
      await writeStore(store);
      return { ok: false, error: "ユーザー情報を確認できません。" };
    }
    const student = findLinkedStudent(store, user.id);
    const resolved = resolveInitialPasswordByPolicy(store, student);
    const initialPassword = resolved.password;

    token.usedAt = nowIso();
    token.consumeIp = consumeMeta?.requestIp || null;
    token.consumeUserAgent = consumeMeta?.userAgent || null;
    user.passwordHash = hashPassword(initialPassword);
    user.mustChangePassword = getSecuritySettings(store).forcePasswordChangeOnFirstLogin !== false;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.updatedAt = nowIso();
    store.passwordResetTokens = (store.passwordResetTokens || []).map((item) =>
      item.userId === user.id && item.id !== token.id && !item.usedAt
        ? { ...item, usedAt: nowIso(), consumeIp: null, consumeUserAgent: "invalidated_after_reset" }
        : item
    );

    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.password_reset_completed",
      targetType: "user",
      targetId: user.id,
      summary: `Password reset completed for ${user.email}`,
      meta: {},
    });
    await writeStore(store);
    return {
      ok: true,
      initialPasswordHint: resolved.hint,
      temporaryPassword: resolved.mode === "random" || resolved.mode === "random_fallback" ? initialPassword : null,
    };
  });
}

function assertSuperAdminActor(actor) {
  if (!actor || String(actor.role || "") !== "admin") {
    throw new Error("権限がありません。");
  }
  if (String(actor.adminRank || "").toUpperCase() !== "SUPER_ADMIN") {
    throw new Error("スーパー管理者のみ実行できます。");
  }
}

/** 公開: 管理者メール宛・レート制限付き再設定トークン発行（存在秘匿のため常に同様の成功を返す） */
export async function requestAdminPasswordResetByEmail({ email, requestIp = null, userAgent = null }) {
  const normalized = normalizeEmail(email);
  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);
    if (!normalized) {
      await writeStore(store);
      return { ok: true, outcome: "noop" };
    }
    if (!adminPwdResetRateAllowed(store, requestIp, normalized)) {
      writeAuditLog(store, {
        actorUserId: null,
        actorRole: "system",
        action: "auth.admin_password_reset_rate_limited",
        targetType: "user",
        targetId: null,
        summary: "Admin password reset rate limited",
        meta: { ip: String(requestIp || "").slice(0, 64) },
      });
      await writeStore(store);
      return { ok: true, outcome: "rate_limited" };
    }
    recordAdminPwdResetAttempt(store, requestIp, normalized);

    const user =
      store.users.find((u) => normalizeEmail(u.email) === normalized && u.role === "admin" && u.status !== "inactive") ||
      null;
    if (!user) {
      await writeStore(store);
      return { ok: true, outcome: "noop" };
    }

    invalidatePendingAdminPasswordResetTokensForUser(store, user.id);
    const { rawToken, token } = createAdminPasswordResetToken(store, {
      user,
      email: user.email,
      requestIp,
      userAgent,
    });
    writeAuditLog(store, {
      actorUserId: null,
      actorRole: "system",
      action: "auth.admin_password_reset_requested",
      targetType: "user",
      targetId: user.id,
      summary: `Admin password reset requested for ${user.email}`,
      meta: {},
    });
    await writeStore(store);
    return {
      ok: true,
      outcome: "mailed",
      rawToken,
      expiresAt: token.expiresAt,
      toEmail: user.email,
    };
  });
}

export async function verifyAdminPasswordResetToken(rawToken) {
  if (!rawToken) return { ok: false, error: "トークンが無効です。" };
  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);
    const tokenHash = hashToken(rawToken);
    const token = (store.adminPasswordResetTokens || []).find((item) => item.tokenHash === tokenHash) || null;
    if (!token || token.usedAt || toMs(token.expiresAt) <= Date.now()) {
      await writeStore(store);
      return { ok: false, error: "再設定リンクの有効期限が切れたか、すでに使用されています。" };
    }
    const user = store.users.find((item) => item.id === token.userId && item.role === "admin") || null;
    if (!user || user.status === "inactive") {
      await writeStore(store);
      return { ok: false, error: "トークンが無効です。" };
    }
    await writeStore(store);
    return { ok: true, expiresAt: token.expiresAt };
  });
}

export async function completeAdminPasswordReset(rawToken, payload = {}, consumeMeta = {}) {
  if (!rawToken) return { ok: false, error: "トークンが無効です。" };
  const newPassword = String(payload?.newPassword || "");
  const confirmPassword = String(payload?.confirmPassword || "");
  if (newPassword.length < 4) {
    return { ok: false, error: "新しいパスワードは4文字以上で入力してください。" };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "確認用パスワードが一致しません。" };
  }
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    cleanExpired(store);
    const tokenHash = hashToken(rawToken);
    const token = (store.adminPasswordResetTokens || []).find((item) => item.tokenHash === tokenHash) || null;
    if (!token || token.usedAt || toMs(token.expiresAt) <= Date.now()) {
      await writeStore(store);
      return { ok: false, error: "再設定リンクの有効期限が切れたか、すでに使用されています。" };
    }
    const user = store.users.find((item) => item.id === token.userId) || null;
    if (!user || user.role !== "admin" || user.status === "inactive") {
      await writeStore(store);
      return { ok: false, error: "トークンが無効です。" };
    }

    token.usedAt = nowIso();
    token.consumeIp = consumeMeta?.requestIp || null;
    token.consumeUserAgent = consumeMeta?.userAgent || null;
    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.updatedAt = nowIso();

    invalidateAllSessionsForUser(store, user.id);
    store.adminPasswordResetTokens = (store.adminPasswordResetTokens || []).map((item) =>
      item.userId === user.id && item.id !== token.id && !item.usedAt
        ? { ...item, usedAt: nowIso(), consumeUserAgent: "invalidated_after_reset" }
        : item
    );

    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: "admin",
      action: "auth.admin_password_reset_completed",
      targetType: "user",
      targetId: user.id,
      summary: `Admin password reset completed for ${user.email}`,
      meta: {},
    });
    await writeStore(store);
    return { ok: true };
  });
}

/** SUPER_ADMIN: 対象管理者へ再設定メール用トークンを発行（内部でメール送信はAPI側） */
export async function superAdminCreateAdminPasswordResetToken(targetUserId, actor) {
  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);
    assertSuperAdminActor(actor);
    const user = store.users.find((u) => u.id === String(targetUserId) && u.role === "admin") || null;
    if (!user) throw new Error("管理者ユーザーが見つかりません。");
    if (user.status === "inactive") throw new Error("このアカウントは利用停止です。");

    invalidatePendingAdminPasswordResetTokensForUser(store, user.id);
    const { rawToken, token } = createAdminPasswordResetToken(store, {
      user,
      email: user.email,
      requestIp: null,
      userAgent: "super_admin_console",
    });
    writeAuditLog(store, {
      actorUserId: actor.userId || null,
      actorRole: "admin",
      action: "auth.admin_password_reset_issued_by_super",
      targetType: "user",
      targetId: user.id,
      summary: `Super admin issued password reset token for ${user.email}`,
      meta: {},
    });
    await writeStore(store);
    return { ok: true, rawToken, expiresAt: token.expiresAt, toEmail: user.email };
  });
}

/** SUPER_ADMIN: 仮パスワード発行・全セッション切断・次回ログイン時変更必須 */
export async function superAdminIssueTemporaryAdminPassword(targetUserId, actor) {
  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);
    assertSuperAdminActor(actor);
    const user = store.users.find((u) => u.id === String(targetUserId) && u.role === "admin") || null;
    if (!user) throw new Error("管理者ユーザーが見つかりません。");
    if (user.status === "inactive") throw new Error("このアカウントは利用停止です。");

    const temp = crypto.randomBytes(12).toString("base64url").slice(0, 16);
    user.passwordHash = hashPassword(temp);
    user.mustChangePassword = true;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.updatedAt = nowIso();
    invalidatePendingAdminPasswordResetTokensForUser(store, user.id);
    invalidateAllSessionsForUser(store, user.id);

    writeAuditLog(store, {
      actorUserId: actor.userId || null,
      actorRole: "admin",
      action: "auth.admin_temporary_password_issued",
      targetType: "user",
      targetId: user.id,
      summary: `Super admin issued temporary password for ${user.email}`,
      meta: {},
    });
    await writeStore(store);
    return { ok: true, temporaryPassword: temp, userId: user.id, email: user.email };
  });
}

export async function getSessionUser(sessionToken) {
  if (!sessionToken) return null;

  return enqueue(async () => {
    const store = await readStore();
    cleanExpired(store);

    const hash = hashToken(sessionToken);
    const session = store.sessions.find((s) => s.sessionHash === hash);
    if (!session) {
      await writeStore(store);
      return null;
    }
    if (toMs(session.expiresAt) <= Date.now()) {
      store.sessions = store.sessions.filter((s) => s.sessionHash !== hash);
      await writeStore(store);
      return null;
    }

    const user = store.users.find((u) => u.id === session.userId);
    if (!user) {
      store.sessions = store.sessions.filter((s) => s.sessionHash !== hash);
      await writeStore(store);
      return null;
    }
    ensureSystemSettings(store);
    if (user.role === "parent" && store.systemSettings?.parent?.parentAccountEnabled === false) {
      store.sessions = store.sessions.filter((s) => s.sessionHash !== hash);
      await writeStore(store);
      return null;
    }

    session.lastSeenAt = nowIso();
    const student = findLinkedStudent(store, user.id);
    if (student) {
      migrateStudentShape(student);
      applyLessonMinutesFromJournal(store, student);
    }
    const pairInfo = student ? resolvePairInfoForStudent(store, student.id) : null;
    const activePointTimeRule = resolveActivePointTimeRule(store);
    const pointConvertedMinutes = student
      ? convertPointsToMinutes(student?.points?.balance || 0, activePointTimeRule)
      : 0;
    await writeStore(store);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        adminRank: user.adminRank || "ADMIN",
        status: user.status,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
      student: student
        ? {
            id: student.id,
            studentNumber: student.studentNumber,
            registrationStatus: student.registrationStatus,
            consentStatus: student.consentStatus,
            nameKanji: student.nameKanji,
            nameFurigana: student.nameFurigana,
            address: student.address,
            birthDate: student.birthDate,
            phone: student.phone,
            extraInfo: student.extraInfo,
            crmProfile: student.crmProfile,
            lessonMinutes: student.lessonMinutes,
            points: student.points,
            pointConvertedMinutes,
            pairInfo,
          }
        : null,
      nextPath: roleNextPath(user, student),
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    };
  });
}

export async function clearSession(sessionToken) {
  if (!sessionToken) return;

  await enqueue(async () => {
    const store = await readStore();
    const hash = hashToken(sessionToken);
    store.sessions = store.sessions.filter((s) => s.sessionHash !== hash);
    await writeStore(store);
  });
}

export async function updateStudentProfileForUser(userId, payload) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    const linkedUser = store.users.find((item) => item.id === userId) || null;

    const ts = nowIso();
    migrateStudentShape(student);
    if (payload?.email !== undefined) {
      const normalizedEmail = normalizeEmail(payload.email);
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        throw new Error("メールアドレスを確認してください。");
      }
      const duplicatedStudent = store.students.find(
        (item) => item.id !== student.id && normalizeEmail(item.email) === normalizedEmail
      );
      if (duplicatedStudent) {
        throw new Error("既に使用中のメールアドレスです。");
      }
      student.email = normalizedEmail;
      if (linkedUser) {
        linkedUser.email = normalizedEmail;
        linkedUser.updatedAt = ts;
      }
    }
    applyStudentProfilePatch(student, payload);
    ensureInitialStudentPasswordIfPossible(store, student);

    if (student.consentStatus === "agreed" && student.registrationStatus !== "completed") {
      const initialPassword = extractLast4DigitsFromPhone(
        student.phoneNormalized || student.phone || student?.crmProfile?.phoneMobile
      );
      if (!initialPassword) {
        throw new Error("携帯電話番号が未登録、または4桁未満のため登録を完了できません。");
      }
      if (linkedUser && !linkedUser.passwordHash) {
        linkedUser.passwordHash = hashPassword(initialPassword);
        linkedUser.mustChangePassword = true;
        linkedUser.updatedAt = ts;
      }
      student.registrationStatus = "completed";
      assignStudentNumberIfNeeded(store, student, { onlyWhenCompleted: true });
    }

    student.updatedAt = student.lessonMinutes?.updatedAt || ts;

    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "student.profile_updated",
      targetType: "student",
      targetId: student.id,
      summary: `Student profile updated for ${student.email}`,
      meta: {
        registrationStatus: student.registrationStatus,
      },
    });

    await writeStore(store);

    return {
      id: student.id,
      studentNumber: student.studentNumber,
      nameKanji: student.nameKanji,
      nameFurigana: student.nameFurigana,
      registrationStatus: student.registrationStatus,
      consentStatus: student.consentStatus,
      address: student.address,
      birthDate: student.birthDate,
      phone: student.phone,
      extraInfo: student.extraInfo,
      crmProfile: student.crmProfile,
      pairInfo: resolvePairInfoForStudent(store, student.id),
    };
  });
}

export async function agreeStudentConsentForUser(userId) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return null;

    const ts = nowIso();
    student.consentStatus = "agreed";
    student.consentAgreedAt = ts;
    if (student.registrationStatus !== "completed") {
      student.registrationStatus = "consent_pending_profile";
    }
    student.updatedAt = ts;

    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "student.consent_agreed",
      targetType: "student",
      targetId: student.id,
      summary: `Student consent agreed for ${student.email}`,
      meta: {
        consentAgreedAt: student.consentAgreedAt,
      },
    });

    await writeStore(store);

    return {
      id: student.id,
      studentNumber: student.studentNumber,
      registrationStatus: student.registrationStatus,
      consentStatus: student.consentStatus,
      consentAgreedAt: student.consentAgreedAt,
    };
  });
}

export async function listStudentsForAdmin(filters = {}, options = {}) {
  return enqueue(async () => {
    const store = await readStore();

    const rows = store.students.map((student) => {
      migrateStudentShape(student);
      applyLessonMinutesFromJournal(store, student);
      const link = store.userStudentLinks.find((item) => item.studentId === student.id);
      const user = link ? store.users.find((item) => item.id === link.userId) : null;
      return toStudentDto(student, user, resolvePairInfoForStudent(store, student.id));
    });

    const filtered = filterStudents(rows, filters);
    const riskSignal = String(filters?.riskSignal || "").trim();
    const riskFiltered = riskSignal
      ? filtered.filter((row) => studentMatchesRiskSignalFilter(buildRiskBadgesForStudent(store, row.id), riskSignal))
      : filtered;
    const sorted = riskFiltered.sort((a, b) => a.email.localeCompare(b.email));
    return paginate(sorted, options.page, options.pageSize);
  });
}

export async function getStudentByIdForAdmin(studentId) {
  return enqueue(async () => {
    const store = await readStore();
    const student = store.students.find((item) => item.id === studentId);
    if (!student) return null;

    migrateStudentShape(student);
    applyLessonMinutesFromJournal(store, student);
    const link = store.userStudentLinks.find((item) => item.studentId === student.id);
    const user = link ? store.users.find((item) => item.id === link.userId) : null;
    const logs = store.lessonMinuteLogs
      .filter((log) => log.studentId === student.id)
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
      .slice(0, 30);
    const lessonMinutePackages = [...store.lessonMinutePackages]
      .sort((a, b) => a.minutes - b.minutes)
      .map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        minutes: pkg.minutes,
        isActive: pkg.isActive,
      }));
    const pairInfo = resolvePairInfoForStudent(store, student.id);
    const parentLinks = resolveParentLinksForStudent(store, student.id);
    const pairHistory = store.studentPairs
      .filter((pair) => pair.studentAId === student.id || pair.studentBId === student.id)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
      .slice(0, 20)
      .map((pair) => {
        const partnerId = pair.studentAId === student.id ? pair.studentBId : pair.studentAId;
        const partner = store.students.find((item) => item.id === partnerId) || null;
        if (partner) migrateStudentShape(partner);
        return {
          id: pair.id,
          status: pair.status,
          startedAt: pair.startedAt || null,
          endedAt: pair.endedAt || null,
          partner: partner
            ? {
                id: partner.id,
                studentNumber: partner.studentNumber || null,
                nameKanji: partner.nameKanji || "",
              }
            : null,
        };
      });

    const ledger = [...(store.lessonMinuteLedger || [])]
      .filter((e) => String(e.studentId) === student.id)
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
      .slice(0, 40);

    return {
      ...toStudentDto(student, user, pairInfo),
      parentLinks,
      lessonMinuteLogs: logs,
      lessonMinuteLedger: ledger,
      ...buildLessonMinuteJournalSlicesForAdmin(store, student.id),
      lessonMinutePackages,
      pairHistory,
    };
  });
}

export async function getAdminLessonMinuteRiskSummary() {
  return enqueue(async () => {
    const store = await readStore();
    let depleted = 0;
    let low180 = 0;
    let nextReservationInsufficient = 0;
    for (const student of store.students) {
      migrateStudentShape(student);
      applyLessonMinutesFromJournal(store, student);
      const rem = Number(student.lessonMinutes?.remainingMinutes || 0);
      if (rem <= 0) depleted += 1;
      else if (rem <= 180) low180 += 1;
      const upcoming = store.reservations
        .filter(
          (r) =>
            r.studentId === student.id && ["requested", "confirmed"].includes(String(r.status || "").trim())
        )
        .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`));
      const nextRes = upcoming[0];
      if (nextRes) {
        const need = Math.max(0, Number(nextRes.durationMinutes || 0));
        if (need > 0 && rem < need) nextReservationInsufficient += 1;
      }
    }
    return { depleted, low180, nextReservationInsufficient, studentTotal: store.students.length };
  });
}

/** JST 基準の YYYY-MM（createdAt は ISO 想定） */
function jstYearMonthFromIso(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  })
    .format(d)
    .slice(0, 7);
}

/**
 * 管理ダッシュボード用・今月（JST）の原簿集計（読み取り専用）
 * - monthUsageMinutes: type=usage の合計（受講完了などの消費）
 * - monthChargeMinutes: type=charge の合計
 * - monthManualPositiveMinutes / monthManualNegativeMinutes: manual_adjustment の正負
 * - activeStudentCount: 当該月に原簿に1件以上ある学生のユニーク数
 * - depletedStudentCount: 現在残り0以下（原簿同期後）
 */
export async function getAdminLessonMinutesMonthSummary(options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const defaultYm = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
    })
      .format(new Date())
      .slice(0, 7);
    const ym = String(options.yearMonth || "").trim() || defaultYm;

    let monthUsageMinutes = 0;
    let monthChargeMinutes = 0;
    let monthManualPositiveMinutes = 0;
    let monthManualNegativeMinutes = 0;
    const activeStudentIds = new Set();

    for (const e of store.lessonMinuteJournal || []) {
      if (!e || typeof e !== "object") continue;
      if (jstYearMonthFromIso(e.createdAt) !== ym) continue;
      const sid = String(e.studentId || "").trim();
      if (sid) activeStudentIds.add(sid);
      const t = String(e.type || "").trim();
      const m = Number(e.minutes || 0);
      if (t === "usage") monthUsageMinutes += Math.abs(m);
      else if (t === "charge") monthChargeMinutes += Math.abs(m);
      else if (t === "manual_adjustment") {
        if (m >= 0) monthManualPositiveMinutes += m;
        else monthManualNegativeMinutes += Math.abs(m);
      }
    }

    let depletedStudentCount = 0;
    for (const student of store.students) {
      migrateStudentShape(student);
      applyLessonMinutesFromJournal(store, student);
      if (Number(student.lessonMinutes?.remainingMinutes || 0) <= 0) depletedStudentCount += 1;
    }

    return {
      yearMonth: ym,
      monthUsageMinutes,
      monthChargeMinutes,
      monthManualPositiveMinutes,
      monthManualNegativeMinutes,
      activeStudentCount: activeStudentIds.size,
      depletedStudentCount,
      studentTotal: store.students.length,
    };
  });
}

export async function resetStudentPasswordByAdmin(studentId, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const student = store.students.find((item) => item.id === studentId) || null;
    if (!student) {
      return { ok: false, error: "学生情報が見つかりません。" };
    }
    migrateStudentShape(student);
    const user = findUserByStudentId(store, student.id);
    if (!user || user.role !== "student") {
      return { ok: false, error: "連携された学生アカウントが見つかりません。" };
    }
    const resolved = resolveInitialPasswordByPolicy(store, student);
    const initialPassword = resolved.password;
    user.passwordHash = hashPassword(initialPassword);
    user.mustChangePassword = getSecuritySettings(store).forcePasswordChangeOnFirstLogin !== false;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.updatedAt = nowIso();
    store.passwordResetTokens = (store.passwordResetTokens || []).map((item) =>
      item.userId === user.id && !item.usedAt
        ? { ...item, usedAt: nowIso(), consumeIp: null, consumeUserAgent: "invalidated_by_admin_reset" }
        : item
    );
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "admin.student_password_reset",
      targetType: "user",
      targetId: user.id,
      summary: `Admin reset temporary password for ${user.email}`,
      meta: { studentId: student.id, userId: user.id },
    });
    await writeStore(store);
    return {
      ok: true,
      initialPasswordHint: resolved.hint,
      temporaryPassword: resolved.mode === "random" || resolved.mode === "random_fallback" ? initialPassword : null,
      mustChangePassword: getSecuritySettings(store).forcePasswordChangeOnFirstLogin !== false,
    };
  });
}

export async function updateStudentByAdmin(studentId, patch, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const student = store.students.find((item) => item.id === studentId);
    if (!student) return null;

    const ts = nowIso();
    let parentProvisioning = null;
    migrateStudentShape(student);

    if (patch?.nameKanji !== undefined) {
      student.nameKanji = String(patch.nameKanji || "").trim();
    }
    if (patch?.nameFurigana !== undefined) {
      student.nameFurigana = String(patch.nameFurigana || "").trim();
    }

    applyStudentProfilePatch(student, {
      addressLine1: patch?.addressLine1,
      addressLine2: patch?.addressLine2,
      postalCode: patch?.postalCode,
      birthDate: patch?.birthDate,
      phoneMobile: patch?.phoneMobile ?? patch?.phone,
      phoneEmergency: patch?.phoneEmergency,
      emergencyContactName: patch?.emergencyContactName,
      emergencyContactNameFurigana: patch?.emergencyContactNameFurigana,
      emergencyContactRelation: patch?.emergencyContactRelation,
      nameKorean: patch?.nameKorean,
      profileImageDataUrl: patch?.profileImageDataUrl,
      adminStudentTendency: patch?.adminStudentTendency,
      adminLessonCautions: patch?.adminLessonCautions,
      adminResponseStyle: patch?.adminResponseStyle,
      adminLearningTraits: patch?.adminLearningTraits,
      adminCounselMemo: patch?.adminCounselMemo,
      notes: patch?.notes ?? patch?.extraInfo,
      address: patch?.address,
      phone: patch?.phone,
      extraInfo: patch?.extraInfo,
    });
    ensureInitialStudentPasswordIfPossible(store, student);

    if (patch?.registrationStatus !== undefined) {
      student.registrationStatus = String(patch.registrationStatus || student.registrationStatus);
    }
    if (patch?.consentStatus !== undefined) {
      student.consentStatus = String(patch.consentStatus || student.consentStatus);
      if (student.consentStatus === "agreed" && !student.consentAgreedAt) {
        student.consentAgreedAt = ts;
      }
    }
    if (patch?.isMinor !== undefined) {
      student.isMinor = Boolean(patch.isMinor);
    }
    if (patch?.guardianRequired !== undefined) {
      student.guardianRequired = Boolean(patch.guardianRequired);
    }
    if (patch?.guardianMemo !== undefined) {
      student.guardianMemo = String(patch.guardianMemo || "").trim();
    }

    if (patch?.pairAction !== undefined) {
      if (getPairPolicySettings(store).pairLessonEnabled === false) {
        throw new Error("ペア機能が無効化されています。");
      }
      const action = String(patch.pairAction || "").trim().toLowerCase();
      if (action === "unlink") {
        const currentPair = findActivePairByStudentId(store, student.id);
        if (currentPair) {
          releasePair(store, currentPair, actor);
          writeAuditLog(store, {
            actorUserId: actor?.userId || null,
            actorRole: actor?.role || "admin",
            action: "student.pair_unlinked",
            targetType: "student_pair",
            targetId: currentPair.id,
            summary: `Admin released pair for ${student.email}`,
            meta: { studentId: student.id, pairId: currentPair.id },
          });
        }
      }
      if (action === "link") {
        const partnerId = String(patch?.pairStudentId || "").trim();
        if (!partnerId) throw new Error("ペア相手の学生を選択してください。");
        if (partnerId === student.id) throw new Error("同じ学生をペアに設定できません。");
        const partner = store.students.find((item) => item.id === partnerId);
        if (!partner) throw new Error("ペア相手の学生が見つかりません。");
        migrateStudentShape(partner);

        const studentCurrentPair = findActivePairByStudentId(store, student.id);
        const partnerCurrentPair = findActivePairByStudentId(store, partner.id);
        releasePair(store, studentCurrentPair, actor);
        if (partnerCurrentPair && partnerCurrentPair.id !== studentCurrentPair?.id) {
          releasePair(store, partnerCurrentPair, actor);
        }

        const pair = {
          id: newId(),
          studentAId: student.id,
          studentBId: partner.id,
          status: "active",
          startedAt: ts,
          endedAt: null,
          createdAt: ts,
          updatedAt: ts,
          createdByUserId: actor?.userId || null,
          updatedByUserId: actor?.userId || null,
        };
        store.studentPairs.push(pair);
        writeAuditLog(store, {
          actorUserId: actor?.userId || null,
          actorRole: actor?.role || "admin",
          action: "student.pair_linked",
          targetType: "student_pair",
          targetId: pair.id,
          summary: `Admin linked pair ${student.email} - ${partner.email}`,
          meta: { studentId: student.id, partnerId: partner.id, pairId: pair.id },
        });
      }
    }

    if (patch?.parentAction !== undefined) {
      const parentAction = String(patch.parentAction || "").trim().toLowerCase();
      const toBool = (value, fallback = true) =>
        value === undefined ? fallback : String(value).trim().toLowerCase() === "true";
      if (parentAction === "link") {
        const parentEmail = String(patch?.parentEmail || "").trim();
        const parentPhone = String(patch?.parentPhone || "").trim();
        const relationship = String(patch?.parentRelationship || "保護者").trim() || "保護者";
        const parentUser = ensureParentUserByEmail(
          store,
          parentEmail,
          String(patch?.parentDisplayName || "").trim(),
          parentPhone
        );
        const provisioning = ensureInitialPasswordForUserByPolicy(store, parentUser, parentPhone || student.phone);
        if (provisioning.provisioned) {
          parentProvisioning = {
            parentEmail: parentUser.email,
            initialPasswordHint: provisioning.hint,
            temporaryPassword: provisioning.temporaryPassword,
          };
        }
        let parentLink =
          store.studentParents.find(
            (link) => link.studentId === student.id && link.parentUserId === parentUser.id
          ) || null;
        if (!parentLink) {
          parentLink = {
            id: newId(),
            studentId: student.id,
            parentUserId: parentUser.id,
            relationship,
            status: "active",
            isPrimary: Boolean(patch?.parentIsPrimary),
            canViewReservations: toBool(patch?.parentCanViewReservations, true),
            canViewLessonNotes: toBool(patch?.parentCanViewLessonNotes, true),
            canViewHomework: toBool(patch?.parentCanViewHomework, true),
            canViewPayments: toBool(patch?.parentCanViewPayments, true),
            canReceiveNotifications: toBool(patch?.parentCanReceiveNotifications, true),
            notes: "",
            linkedByUserId: actor?.userId || null,
            unlinkedAt: null,
            unlinkedByUserId: null,
            createdAt: ts,
            updatedAt: ts,
          };
          migrateStudentParentShape(parentLink);
          store.studentParents.push(parentLink);
        } else {
          parentLink.status = "active";
          parentLink.relationship = relationship;
          if (patch?.parentIsPrimary !== undefined) {
            parentLink.isPrimary = Boolean(patch.parentIsPrimary);
          }
          if (patch?.parentCanViewReservations !== undefined) {
            parentLink.canViewReservations = toBool(patch.parentCanViewReservations, true);
          }
          if (patch?.parentCanViewLessonNotes !== undefined) {
            parentLink.canViewLessonNotes = toBool(patch.parentCanViewLessonNotes, true);
          }
          if (patch?.parentCanViewHomework !== undefined) {
            parentLink.canViewHomework = toBool(patch.parentCanViewHomework, true);
          }
          if (patch?.parentCanViewPayments !== undefined) {
            parentLink.canViewPayments = toBool(patch.parentCanViewPayments, true);
          }
          if (patch?.parentCanReceiveNotifications !== undefined) {
            parentLink.canReceiveNotifications = toBool(patch.parentCanReceiveNotifications, true);
          }
          parentLink.updatedAt = ts;
          parentLink.unlinkedAt = null;
          parentLink.unlinkedByUserId = null;
        }
        if (parentLink.isPrimary) {
          store.studentParents.forEach((link) => {
            if (link.studentId === student.id && link.id !== parentLink.id) {
              link.isPrimary = false;
              link.updatedAt = ts;
            }
          });
        }
        writeAuditLog(store, {
          actorUserId: actor?.userId || null,
          actorRole: actor?.role || "admin",
          action: "student.parent_linked",
          targetType: "student_parent",
          targetId: parentLink.id,
          summary: `Admin linked parent ${parentUser.email} to ${student.email}`,
          meta: { studentId: student.id, parentUserId: parentUser.id, relationship },
        });
      }
      if (parentAction === "unlink") {
        const targetLinkId = String(patch?.parentLinkId || "").trim();
        const targetParentUserId = String(patch?.parentUserId || "").trim();
        const target =
          store.studentParents.find(
            (link) =>
              link.studentId === student.id &&
              link.status === "active" &&
              ((targetLinkId && link.id === targetLinkId) ||
                (targetParentUserId && link.parentUserId === targetParentUserId))
          ) || null;
        if (!target) throw new Error("解除対象の保護者連携が見つかりません。");
        target.status = "inactive";
        target.unlinkedAt = ts;
        target.unlinkedByUserId = actor?.userId || null;
        target.updatedAt = ts;
        writeAuditLog(store, {
          actorUserId: actor?.userId || null,
          actorRole: actor?.role || "admin",
          action: "student.parent_unlinked",
          targetType: "student_parent",
          targetId: target.id,
          summary: `Admin unlinked parent from ${student.email}`,
          meta: { studentId: student.id, parentUserId: target.parentUserId },
        });
      }
      if (parentAction === "update") {
        const targetLinkId = String(patch?.parentLinkId || "").trim();
        if (!targetLinkId) throw new Error("更新対象の保護者連携を選択してください。");
        const target = store.studentParents.find((link) => link.id === targetLinkId && link.studentId === student.id);
        if (!target) throw new Error("更新対象の保護者連携が見つかりません。");
        target.relationship = String(patch?.parentRelationship || target.relationship || "保護者").trim() || "保護者";
        if (patch?.parentIsPrimary !== undefined) {
          target.isPrimary = Boolean(patch.parentIsPrimary);
        }
        if (patch?.parentCanViewReservations !== undefined) {
          target.canViewReservations = toBool(patch.parentCanViewReservations, true);
        }
        if (patch?.parentCanViewLessonNotes !== undefined) {
          target.canViewLessonNotes = toBool(patch.parentCanViewLessonNotes, true);
        }
        if (patch?.parentCanViewHomework !== undefined) {
          target.canViewHomework = toBool(patch.parentCanViewHomework, true);
        }
        if (patch?.parentCanViewPayments !== undefined) {
          target.canViewPayments = toBool(patch.parentCanViewPayments, true);
        }
        if (patch?.parentCanReceiveNotifications !== undefined) {
          target.canReceiveNotifications = toBool(patch.parentCanReceiveNotifications, true);
        }
        if (patch?.parentPhone !== undefined) {
          const parentUser = store.users.find((user) => user.id === target.parentUserId) || null;
          if (parentUser) {
            parentUser.phone = String(patch.parentPhone || "").trim();
            parentUser.phoneNormalized = normalizePhone(parentUser.phone);
            parentUser.updatedAt = ts;
          }
        }
        target.updatedAt = ts;
        if (target.isPrimary) {
          store.studentParents.forEach((link) => {
            if (link.studentId === student.id && link.id !== target.id) {
              link.isPrimary = false;
              link.updatedAt = ts;
            }
          });
        }
        writeAuditLog(store, {
          actorUserId: actor?.userId || null,
          actorRole: actor?.role || "admin",
          action: "student.parent_updated",
          targetType: "student_parent",
          targetId: target.id,
          summary: `Admin updated parent permission for ${student.email}`,
          meta: { studentId: student.id, parentUserId: target.parentUserId },
        });
      }
      if (parentAction === "reset_password") {
        const targetLinkId = String(patch?.parentLinkId || "").trim();
        if (!targetLinkId) throw new Error("初期化対象の保護者連携を選択してください。");
        const target = store.studentParents.find((link) => link.id === targetLinkId && link.studentId === student.id);
        if (!target) throw new Error("初期化対象の保護者連携が見つかりません。");
        const parentUser = store.users.find((user) => user.id === target.parentUserId && user.role === "parent") || null;
        if (!parentUser) throw new Error("保護者アカウントが見つかりません。");
        const resolved = resolveInitialPasswordByPolicy(store, {
          phoneNormalized: parentUser.phoneNormalized || parentUser.phone || student.phoneNormalized || student.phone,
        });
        parentUser.passwordHash = hashPassword(resolved.password);
        parentUser.mustChangePassword = getSecuritySettings(store).forcePasswordChangeOnFirstLogin !== false;
        parentUser.failedLoginCount = 0;
        parentUser.lockedUntil = null;
        parentUser.updatedAt = ts;
        parentProvisioning = {
          parentEmail: parentUser.email,
          initialPasswordHint: resolved.hint,
          temporaryPassword: resolved.mode === "random" || resolved.mode === "random_fallback" ? resolved.password : null,
        };
        writeAuditLog(store, {
          actorUserId: actor?.userId || null,
          actorRole: actor?.role || "admin",
          action: "student.parent_password_reset",
          targetType: "user",
          targetId: parentUser.id,
          summary: `Admin reset parent password for ${parentUser.email}`,
          meta: { studentId: student.id, parentUserId: parentUser.id },
        });
      }
    }
    assignStudentNumberIfNeeded(store, student, { onlyWhenCompleted: true });

    const touchesLessonMinutesPatch =
      patch?.lessonMinutesCreditMinutes !== undefined ||
      patch?.lessonMinutesDeductMinutes !== undefined ||
      patch?.lessonMinutesAdjustMinutes !== undefined;
    if (touchesLessonMinutesPatch) {
      assertAdminLessonMinutePatch(patch);
    }

    const opId = String(patch?.lessonMinutesOperationId || "").trim();
    const skipLessonOps =
      Boolean(opId) &&
      Array.isArray(store.processedLessonMinuteOpIds) &&
      store.processedLessonMinuteOpIds.includes(opId);
    let didLessonMinuteMutation = false;

    if (!skipLessonOps) {
      if (patch?.lessonMinutesCreditMinutes !== undefined) {
        const selectedPackageId = String(patch?.lessonMinutesCreditPackageId || "").trim();
        const selectedPackage = selectedPackageId
          ? store.lessonMinutePackages.find((pkg) => pkg.id === selectedPackageId && pkg.isActive)
          : null;
        const creditMinutes = selectedPackage
          ? Number(selectedPackage.minutes || 0)
          : Number(patch.lessonMinutesCreditMinutes || 0);
        if (creditMinutes > 0) {
          applyStudentLessonMinuteCredit(
            store,
            student,
            creditMinutes,
            actor,
            patch?.lessonMinutesCreditType,
            String(patch?.lessonMinutesCreditReason || "").trim(),
            selectedPackage
          );
          didLessonMinuteMutation = true;
          if (creditMinutes >= 3000) {
            writeAuditLog(store, {
              actorUserId: actor?.userId || null,
              actorRole: actor?.role || "admin",
              action: "student.lesson_minutes_large_operation",
              targetType: "student",
              targetId: student.id,
              summary: `Large lesson minute credit (${creditMinutes}m) for ${student.email}`,
              meta: { minutes: creditMinutes, kind: "credit" },
            });
          }
        }
      }

      if (patch?.lessonMinutesDeductMinutes !== undefined) {
        const deductMinutes = Math.max(0, Math.floor(Number(patch.lessonMinutesDeductMinutes || 0)));
        if (deductMinutes > 0) {
          applyStudentLessonMinuteDebit(
            store,
            student,
            deductMinutes,
            actor,
            String(patch?.lessonMinutesDeductReason || patch?.lessonMinutesDeductMemo || "").trim() ||
              "admin_manual_deduct",
            null
          );
          didLessonMinuteMutation = true;
          if (deductMinutes >= 3000) {
            writeAuditLog(store, {
              actorUserId: actor?.userId || null,
              actorRole: actor?.role || "admin",
              action: "student.lesson_minutes_large_operation",
              targetType: "student",
              targetId: student.id,
              summary: `Large lesson minute deduct (${deductMinutes}m) for ${student.email}`,
              meta: { minutes: deductMinutes, kind: "deduct" },
            });
          }
        }
      }

      if (patch?.lessonMinutesAdjustMinutes !== undefined) {
        const deltaMinutes = Number(patch.lessonMinutesAdjustMinutes || 0);
        if (deltaMinutes !== 0) {
          applyStudentLessonMinuteManualAdjustment(
            store,
            student,
            deltaMinutes,
            actor,
            String(patch?.lessonMinutesAdjustReason || "").trim()
          );
          didLessonMinuteMutation = true;
          if (Math.abs(deltaMinutes) >= 3000) {
            writeAuditLog(store, {
              actorUserId: actor?.userId || null,
              actorRole: actor?.role || "admin",
              action: "student.lesson_minutes_large_operation",
              targetType: "student",
              targetId: student.id,
              summary: `Large lesson minute manual adjust (${deltaMinutes}m) for ${student.email}`,
              meta: { minutes: deltaMinutes, kind: "manual_adjustment" },
            });
          }
        }
      }

      if (didLessonMinuteMutation && opId) {
        rememberProcessedLessonMinuteOpId(store, opId);
      }
    }

    student.updatedAt = ts;

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "admin.student_updated",
      targetType: "student",
      targetId: student.id,
      summary: `Admin updated student ${student.email}`,
      meta: {
        registrationStatus: student.registrationStatus,
        consentStatus: student.consentStatus,
      },
    });

    await writeStore(store);

    const link = store.userStudentLinks.find((item) => item.studentId === student.id);
    const user = link ? store.users.find((item) => item.id === link.userId) : null;
    const logs = store.lessonMinuteLogs
      .filter((log) => log.studentId === student.id)
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
      .slice(0, 30);
    const lessonMinutePackages = [...store.lessonMinutePackages]
      .sort((a, b) => a.minutes - b.minutes)
      .map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        minutes: pkg.minutes,
        isActive: pkg.isActive,
      }));
    const pairInfo = resolvePairInfoForStudent(store, student.id);
    const parentLinks = resolveParentLinksForStudent(store, student.id);
    const pairHistory = store.studentPairs
      .filter((pair) => pair.studentAId === student.id || pair.studentBId === student.id)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
      .slice(0, 20)
      .map((pair) => {
        const partnerId = pair.studentAId === student.id ? pair.studentBId : pair.studentAId;
        const partner = store.students.find((item) => item.id === partnerId) || null;
        if (partner) migrateStudentShape(partner);
        return {
          id: pair.id,
          status: pair.status,
          startedAt: pair.startedAt || null,
          endedAt: pair.endedAt || null,
          partner: partner
            ? {
                id: partner.id,
                studentNumber: partner.studentNumber || null,
                nameKanji: partner.nameKanji || "",
              }
            : null,
        };
      });
    const ledger = [...(store.lessonMinuteLedger || [])]
      .filter((e) => String(e.studentId) === student.id)
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
      .slice(0, 40);
    applyLessonMinutesFromJournal(store, student);
    return {
      ...toStudentDto(student, user, pairInfo),
      parentLinks,
      lessonMinuteLogs: logs,
      lessonMinuteLedger: ledger,
      ...buildLessonMinuteJournalSlicesForAdmin(store, student.id),
      lessonMinutePackages,
      pairHistory,
      parentProvisioning,
    };
  });
}

export async function listAuditLogsForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const action = String(filters?.action || "").trim();
    const targetType = String(filters?.targetType || "").trim();
    const studentId = String(filters?.studentId || "").trim();
    const { fromAt, toAt } = toDateRange(filters?.fromDate, filters?.toDate);

    let logs = [...store.auditLogs].sort((a, b) => b.at.localeCompare(a.at));

    if (action) logs = logs.filter((item) => item.action === action);
    if (targetType) logs = logs.filter((item) => item.targetType === targetType);
    if (fromAt) logs = logs.filter((item) => item.at >= fromAt);
    if (toAt) logs = logs.filter((item) => item.at <= toAt);
    if (studentId) logs = logs.filter((item) => matchesStudentFilter(item, studentId));

    const { items, pagination } = paginate(
      logs,
      Number(filters?.page || 1),
      Number(filters?.pageSize || filters?.limit || 30)
    );
    return { items, pagination };
  });
}

export async function recordMailLog(entry = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const now = nowIso();
    const log = {
      id: newId(),
      type: String(entry.type || "unknown").trim() || "unknown",
      toEmail: normalizeEmail(entry.toEmail || ""),
      recipientEmail: normalizeEmail(entry.recipientEmail || entry.toEmail || ""),
      recipientName: String(entry.recipientName || "").trim() || null,
      recipientRole: String(entry.recipientRole || "").trim() || null,
      subject: String(entry.subject || "").trim(),
      status: String(entry.status || "unknown").trim() || "unknown",
      mode: String(entry.mode || "").trim() || null,
      messageId: String(entry.messageId || "").trim() || null,
      error: String(entry.error || "").trim() || null,
      errorMessage: String(entry.errorMessage || entry.error || "").trim() || null,
      linkUrl: String(entry.linkUrl || "").trim() || null,
      templateName: String(entry.templateName || "").trim() || null,
      sentAt: String(entry.sentAt || "").trim() || (entry.status === "sent" ? now : null),
      failedAt: String(entry.failedAt || "").trim() || (entry.status === "failed" ? now : null),
      bodyPreviewText: String(entry.bodyPreviewText || "").trim() || null,
      bodyPreviewHtml: String(entry.bodyPreviewHtml || "").trim() || null,
      relatedStudentId: String(entry.relatedStudentId || "").trim() || null,
      relatedParentId: String(entry.relatedParentId || "").trim() || null,
      relatedReservationId: String(entry.relatedReservationId || "").trim() || null,
      relatedLessonNoteId: String(entry.relatedLessonNoteId || "").trim() || null,
      relatedNoticeId: String(entry.relatedNoticeId || "").trim() || null,
      resentFromLogId: String(entry.resentFromLogId || "").trim() || null,
      meta: typeof entry.meta === "object" && entry.meta ? entry.meta : {},
      createdAt: now,
      updatedAt: now,
    };
    migrateMailLogShape(log);
    store.mailLogs.push(log);
    if (store.mailLogs.length > MAIL_LOG_LIMIT) {
      store.mailLogs = store.mailLogs.slice(-MAIL_LOG_LIMIT);
    }
    await writeStore(store);
    return log;
  });
}

export async function listMailLogsForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const type = String(filters?.type || "").trim();
    const status = String(filters?.status || "").trim();
    const toEmail = normalizeEmail(filters?.toEmail || "");
    const recipientName = String(filters?.recipientName || "").trim().toLowerCase();
    const studentName = String(filters?.studentName || "").trim().toLowerCase();
    const parentName = String(filters?.parentName || "").trim().toLowerCase();
    const studentId = String(filters?.studentId || "").trim();
    const parentId = String(filters?.parentId || "").trim();
    const { fromAt, toAt } = toDateRange(filters?.fromDate, filters?.toDate);

    let logs = [...store.mailLogs].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    if (type) logs = logs.filter((item) => item.type === type);
    if (status) logs = logs.filter((item) => item.status === status);
    if (toEmail) logs = logs.filter((item) => (item.recipientEmail || item.toEmail || "").includes(toEmail));
    if (recipientName) {
      logs = logs.filter((item) => String(item.recipientName || "").toLowerCase().includes(recipientName));
    }
    if (studentName) {
      logs = logs.filter((item) =>
        String(item.meta?.studentName || "").toLowerCase().includes(studentName)
      );
    }
    if (parentName) {
      logs = logs.filter((item) =>
        String(item.meta?.parentName || item.recipientName || "").toLowerCase().includes(parentName)
      );
    }
    if (studentId) logs = logs.filter((item) => String(item.relatedStudentId || "") === studentId);
    if (parentId) logs = logs.filter((item) => String(item.relatedParentId || "") === parentId);
    if (fromAt) logs = logs.filter((item) => item.createdAt >= fromAt);
    if (toAt) logs = logs.filter((item) => item.createdAt <= toAt);

    const { items, pagination } = paginate(
      logs,
      Number(filters?.page || 1),
      Number(filters?.pageSize || filters?.limit || 30),
    );
    return { items, pagination };
  });
}

export async function getMailLogByIdForAdmin(logId) {
  return enqueue(async () => {
    const store = await readStore();
    const log = store.mailLogs.find((item) => item.id === String(logId || "").trim()) || null;
    if (!log) return null;
    return log;
  });
}

const MAIL_TEMPLATE_CATALOG = [
  { type: "student_registration_verify", label: "学生登録確認", defaultSubject: "【MalMoi韓国語教室】登録を続けてください" },
  { type: "password_reset", label: "パスワード再設定", defaultSubject: "【MalMoi韓国語教室】パスワード再設定のご案内" },
  {
    type: "admin_password_reset",
    label: "管理者パスワード再設定",
    defaultSubject: "【MalMoi韓国語教室】管理者パスワード再設定のご案内",
  },
  { type: "reservation_created", label: "予約完了", defaultSubject: "【MalMoi韓国語教室】レッスン予約が完了しました" },
  { type: "reservation_updated", label: "予約変更", defaultSubject: "【MalMoi韓国語教室】レッスン予約が変更されました" },
  { type: "lesson_note_published", label: "レッスンノート通知", defaultSubject: "【MalMoi韓国語教室】レッスンノート通知" },
  { type: "homework_assigned", label: "宿題通知", defaultSubject: "【MalMoi韓国語教室】新しい宿題があります" },
  { type: "notice_published", label: "お知らせ通知", defaultSubject: "【MalMoi韓国語教室】お知らせ" },
  { type: "lesson_reminder_day_before", label: "前日リマインド", defaultSubject: "【MalMoi韓国語教室】前日のレッスン案内" },
  { type: "lesson_reminder_same_day", label: "当日リマインド", defaultSubject: "【MalMoi韓国語教室】本日のレッスンのお知らせ" },
];

export async function listMailTemplatesForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    return MAIL_TEMPLATE_CATALOG.map((template) => {
      const setting = store.mailTemplateSettings.find((item) => item.type === template.type) || null;
      return {
        ...template,
        templateName: template.type,
        isActive: setting ? setting.isActive !== false : true,
        updatedAt: setting?.updatedAt || null,
      };
    });
  });
}

export async function setMailTemplateActiveByAdmin(type, isActive, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const targetType = String(type || "").trim();
    const exists = MAIL_TEMPLATE_CATALOG.some((item) => item.type === targetType);
    if (!exists) throw new Error("未対応テンプレートです。");
    const target = store.mailTemplateSettings.find((item) => item.type === targetType) || null;
    const now = nowIso();
    if (!target) {
      const created = {
        type: targetType,
        isActive: isActive !== false,
        createdAt: now,
        updatedAt: now,
        updatedByUserId: actor?.userId || null,
      };
      migrateMailTemplateSettingShape(created);
      store.mailTemplateSettings.push(created);
    } else {
      target.isActive = isActive !== false;
      target.updatedAt = now;
      target.updatedByUserId = actor?.userId || null;
      migrateMailTemplateSettingShape(target);
    }
    await writeStore(store);
    return true;
  });
}

export async function isMailTemplateEnabled(type) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const targetType = String(type || "").trim();
    if (!targetType) return true;
    const notificationMap = {
      notice_published: "noticePublished",
      lesson_reminder_day_before: "lessonReminderDayBefore",
      lesson_reminder_same_day: "lessonReminderSameDay",
      homework_assigned: "homeworkAssigned",
      lesson_note_published: "lessonNotePublished",
    };
    const notificationKey = notificationMap[targetType];
    if (notificationKey && store.systemSettings?.notifications?.[notificationKey] === false) {
      return false;
    }
    const setting = store.mailTemplateSettings.find((item) => item.type === targetType) || null;
    return setting ? setting.isActive !== false : true;
  });
}

export async function listTeacherUsersForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    return store.users
      .filter((user) => user.role === "teacher" && user.status !== "inactive")
      .map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email,
        status: user.status,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  });
}

export async function listAdminUsersForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    return store.users
      .filter((user) => user.role === "admin")
      .map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email,
        nameFurigana: user.nameFurigana || "",
        phone: user.phone || "",
        adminRank: user.adminRank || "ADMIN",
        status: user.status || "active",
        lastLoginAt: user.lastLoginAt || null,
        profileImageDataUrl: user.profileImageDataUrl || "",
        jobTitle: user.jobTitle || "",
        signatureNote: user.signatureNote || "",
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  });
}

function ensureRoleInvitationsArray(store) {
  if (!Array.isArray(store.roleInvitations)) store.roleInvitations = [];
}

function ensureTeacherAvailabilityProfilesArray(store) {
  if (!Array.isArray(store.teacherAvailabilityProfiles)) store.teacherAvailabilityProfiles = [];
}

function findTeacherAvailabilityProfile(store, teacherUserId) {
  ensureTeacherAvailabilityProfilesArray(store);
  const tid = String(teacherUserId || "").trim();
  let row = store.teacherAvailabilityProfiles.find((p) => p.teacherUserId === tid);
  if (!row) {
    row = {
      teacherUserId: tid,
      weekly: {},
      exceptions: [],
      adminLocks: [],
      changeRequests: [],
      updatedAt: nowIso(),
    };
    store.teacherAvailabilityProfiles.push(row);
  }
  return row;
}

export async function listRoleInvitationsForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    ensureRoleInvitationsArray(store);
    return [...store.roleInvitations]
      .filter((r) => r && r.status === "pending")
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .map((r) => ({
        id: r.id,
        role: r.role,
        email: r.email,
        studentId: r.studentId || "",
        relationship: r.relationship || "",
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      }));
  });
}

export async function createRoleInvitationByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureRoleInvitationsArray(store);
    const role = String(payload?.role || "").trim().toLowerCase();
    if (role !== "teacher" && role !== "parent") {
      throw new Error("役割は teacher または parent を指定してください。");
    }
    const email = normalizeEmail(payload?.email || "");
    if (!email) throw new Error("メールアドレスが必要です。");
    const studentId = String(payload?.studentId || "").trim();
    const relationship = String(payload?.relationship || "保護者").trim() || "保護者";
    if (role === "parent" && !studentId) throw new Error("保護者招待には対象学生IDが必要です。");
    const student =
      role === "parent" ? store.students.find((s) => String(s.id) === studentId) || null : null;
    if (role === "parent" && !student) throw new Error("対象学生が見つかりません。");

    const existingUser = store.users.find((u) => u.email === email);
    if (existingUser && existingUser.passwordHash) {
      throw new Error("このメールは既に登録済みです。");
    }
    if (existingUser && existingUser.role && existingUser.role !== role) {
      throw new Error("このメールは別の役割で登録されています。");
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    const invitation = {
      id: newId(),
      role,
      email,
      displayNameSuggestion: String(payload?.displayName || "").trim(),
      studentId: role === "parent" ? studentId : "",
      relationship: role === "parent" ? relationship : "",
      tokenHash: hashToken(rawToken),
      status: "pending",
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      consumedAt: null,
      createdByUserId: actor?.userId || null,
    };
    store.roleInvitations.push(invitation);
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "role_invitation.created",
      targetType: "role_invitation",
      targetId: invitation.id,
      summary: `Role invite (${role}) for ${email}`,
      meta: { role, email, studentId: invitation.studentId, relationship: invitation.relationship },
    });
    await writeStore(store);
    return { ok: true, invitationId: invitation.id, rawToken, expiresAt: invitation.expiresAt };
  });
}

export async function getRoleInvitationPreviewByToken(rawToken) {
  return enqueue(async () => {
    const store = await readStore();
    ensureRoleInvitationsArray(store);
    const th = hashToken(String(rawToken || "").trim());
    const inv = store.roleInvitations.find((i) => i.tokenHash === th && i.status === "pending") || null;
    if (!inv || toMs(inv.expiresAt) <= Date.now()) {
      return { ok: false, error: "招待が無効か期限切れです。" };
    }
    const student =
      inv.role === "parent"
        ? store.students.find((s) => String(s.id) === String(inv.studentId)) || null
        : null;
    return {
      ok: true,
      role: inv.role,
      email: inv.email,
      displayNameSuggestion: inv.displayNameSuggestion || "",
      studentId: inv.studentId || "",
      relationship: inv.relationship || "",
      studentNameKanji: student?.nameKanji || "",
    };
  });
}

export async function completeRoleInvitationByToken({
  rawToken,
  password,
  displayName,
  phone = "",
  nameFurigana = "",
}) {
  return enqueue(async () => {
    const store = await readStore();
    ensureRoleInvitationsArray(store);
    const th = hashToken(String(rawToken || "").trim());
    const inv = store.roleInvitations.find((i) => i.tokenHash === th && i.status === "pending") || null;
    if (!inv || toMs(inv.expiresAt) <= Date.now()) {
      throw new Error("招待が無効か期限切れです。");
    }
    const pwd = String(password || "");
    if (pwd.length < 8) throw new Error("パスワードは8文字以上にしてください。");
    const email = inv.email;
    const role = inv.role;
    let user = store.users.find((u) => u.email === email) || null;
    const ts = nowIso();
    if (!user) {
      user = {
        id: newId(),
        email,
        displayName: String(displayName || inv.displayNameSuggestion || "").trim() || displayNameFromEmail(email),
        role,
        status: "active",
        nameFurigana: String(nameFurigana || "").trim(),
        phone: String(phone || "").trim(),
        phoneNormalized: normalizePhone(phone || ""),
        adminRank: "",
        passwordHash: hashPassword(pwd),
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
        createdAt: ts,
        updatedAt: ts,
        lastLoginAt: null,
        profileImageDataUrl: "",
        jobTitle: "",
        signatureNote: "",
      };
      store.users.push(user);
    } else {
      if (user.role !== role) throw new Error("役割が一致しません。");
      user.displayName = String(displayName || user.displayName || "").trim() || user.displayName;
      user.nameFurigana = String(nameFurigana || user.nameFurigana || "").trim();
      user.phone = String(phone || user.phone || "").trim();
      user.phoneNormalized = normalizePhone(user.phone);
      user.passwordHash = hashPassword(pwd);
      user.mustChangePassword = false;
      user.updatedAt = ts;
    }

    if (role === "parent") {
      const student = store.students.find((s) => String(s.id) === String(inv.studentId)) || null;
      if (!student) throw new Error("対象学生が見つかりません。");
      migrateStudentShape(student);
      let parentLink = store.studentParents.find(
        (link) => link.studentId === student.id && link.parentUserId === user.id
      );
      if (!parentLink) {
        parentLink = {
          id: newId(),
          studentId: student.id,
          parentUserId: user.id,
          relationship: inv.relationship || "保護者",
          status: "active",
          isPrimary: false,
          canViewReservations: true,
          canViewLessonNotes: true,
          canViewHomework: true,
          canViewPayments: true,
          canReceiveNotifications: true,
          notes: "",
          linkedByUserId: inv.createdByUserId || null,
          unlinkedAt: null,
          unlinkedByUserId: null,
          createdAt: ts,
          updatedAt: ts,
        };
        migrateStudentParentShape(parentLink);
        store.studentParents.push(parentLink);
      } else {
        parentLink.status = "active";
        parentLink.relationship = inv.relationship || parentLink.relationship;
        parentLink.updatedAt = ts;
        parentLink.unlinkedAt = null;
        parentLink.unlinkedByUserId = null;
      }
      writeAuditLog(store, {
        actorUserId: user.id,
        actorRole: "parent",
        action: "student.parent_linked",
        targetType: "student_parent",
        targetId: parentLink.id,
        summary: `Parent completed invite link for ${email}`,
        meta: { studentId: student.id, parentUserId: user.id, via: "role_invitation" },
      });
    }

    inv.status = "consumed";
    inv.consumedAt = ts;
    writeAuditLog(store, {
      actorUserId: user.id,
      actorRole: role,
      action: "role_invitation.completed",
      targetType: "role_invitation",
      targetId: inv.id,
      summary: `Completed role invitation (${role}) for ${email}`,
      meta: { userId: user.id },
    });
    await writeStore(store);
    return { ok: true, userId: user.id, role };
  });
}

export async function listTeacherAvailabilityForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    ensureTeacherAvailabilityProfilesArray(store);
    const teachers = store.users
      .filter((user) => user.role === "teacher" && user.status !== "inactive")
      .map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    return teachers.map((t) => {
      const p = findTeacherAvailabilityProfile(store, t.id);
      return {
        teacherUserId: t.id,
        displayName: t.displayName,
        email: t.email,
        weekly: p.weekly || {},
        exceptions: p.exceptions || [],
        adminLocks: p.adminLocks || [],
        changeRequests: (p.changeRequests || []).filter((c) => c.status === "pending"),
        updatedAt: p.updatedAt,
      };
    });
  });
}

export async function updateTeacherAvailabilityByAdmin(teacherUserId, patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const teacher = store.users.find((u) => u.id === teacherUserId && u.role === "teacher");
    if (!teacher) throw new Error("講師が見つかりません。");
    const row = findTeacherAvailabilityProfile(store, teacherUserId);
    if (patch?.weekly !== undefined) row.weekly = patch.weekly && typeof patch.weekly === "object" ? patch.weekly : {};
    if (patch?.exceptions !== undefined) row.exceptions = Array.isArray(patch.exceptions) ? patch.exceptions : [];
    if (patch?.adminLocks !== undefined) row.adminLocks = Array.isArray(patch.adminLocks) ? patch.adminLocks : [];
    row.updatedAt = nowIso();
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "teacher_availability.updated",
      targetType: "teacher",
      targetId: teacherUserId,
      summary: `Admin updated availability for ${teacher.email}`,
      meta: {},
    });
    await writeStore(store);
    return { ok: true, profile: row };
  });
}

export async function updateTeacherAvailabilityBySelf(userId, patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const pol = store.systemSettings?.teacherSchedulePolicy || {};
    if (pol.adminOnlyEdit) throw new Error("現在、講師による変更は無効です。管理者にお問い合わせください。");
    if (String(actor?.userId || "") !== String(userId || "")) throw new Error("権限がありません。");
    const teacher = store.users.find((u) => u.id === userId && u.role === "teacher");
    if (!teacher) throw new Error("講師アカウントが見つかりません。");
    const row = findTeacherAvailabilityProfile(store, userId);
    if (patch?.weekly !== undefined) row.weekly = patch.weekly && typeof patch.weekly === "object" ? patch.weekly : {};
    if (patch?.exceptions !== undefined) row.exceptions = Array.isArray(patch.exceptions) ? patch.exceptions : [];
    row.updatedAt = nowIso();
    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "teacher",
      action: "teacher_availability.self_updated",
      targetType: "teacher",
      targetId: userId,
      summary: `Teacher self-updated availability`,
      meta: {},
    });
    await writeStore(store);
    return { ok: true, profile: row };
  });
}

export async function getTeacherAvailabilityForSelf(userId) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const teacher = store.users.find((u) => u.id === userId && u.role === "teacher");
    if (!teacher) return null;
    const row = findTeacherAvailabilityProfile(store, userId);
    return {
      policy: store.systemSettings?.teacherSchedulePolicy || {},
      weekly: row.weekly || {},
      exceptions: row.exceptions || [],
      adminLocks: row.adminLocks || [],
      updatedAt: row.updatedAt,
    };
  });
}

export async function updateAdminUserProfileByAdmin(targetUserId, patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const target = store.users.find((u) => u.id === targetUserId && u.role === "admin");
    if (!target) throw new Error("管理者ユーザーが見つかりません。");
    const isSuper = String(actor?.adminRank || "").toUpperCase() === "SUPER_ADMIN";
    const isSelf = String(actor?.userId || "") === String(targetUserId);
    if (!isSuper && !isSelf) throw new Error("このアカウントを編集する権限がありません。");
    if (patch?.displayName !== undefined) target.displayName = String(patch.displayName || "").trim() || target.displayName;
    if (patch?.email !== undefined && isSuper) {
      const next = normalizeEmail(patch.email || "");
      if (!next) throw new Error("メールが不正です。");
      if (store.users.some((u) => u.id !== target.id && u.email === next)) {
        throw new Error("このメールは他ユーザーが使用中です。");
      }
      target.email = next;
    } else if (patch?.email !== undefined && !isSuper) {
      throw new Error("メール変更はSUPER ADMINのみ可能です。");
    }
    if (patch?.phone !== undefined) {
      target.phone = String(patch.phone || "").trim();
      target.phoneNormalized = normalizePhone(target.phone);
    }
    if (patch?.nameFurigana !== undefined) target.nameFurigana = String(patch.nameFurigana || "").trim();
    if (patch?.profileImageDataUrl !== undefined) {
      target.profileImageDataUrl = String(patch.profileImageDataUrl || "").trim();
    }
    if (patch?.jobTitle !== undefined) target.jobTitle = String(patch.jobTitle || "").trim();
    if (patch?.signatureNote !== undefined) target.signatureNote = String(patch.signatureNote || "").trim();
    if (patch?.status !== undefined && isSuper) {
      const st = String(patch.status || "").trim();
      if (st === "active" || st === "inactive") target.status = st;
    }
    if (patch?.adminRank !== undefined && isSuper) {
      const r = String(patch.adminRank || "").toUpperCase();
      if (r === "SUPER_ADMIN" || r === "ADMIN") target.adminRank = r;
    }
    target.updatedAt = nowIso();
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "admin_user.profile_updated",
      targetType: "user",
      targetId: target.id,
      summary: `Admin profile updated for ${target.email}`,
      meta: { keys: Object.keys(patch || {}) },
    });
    await writeStore(store);
    return { ok: true, user: { id: target.id, email: target.email, displayName: target.displayName } };
  });
}

export async function listPointConversionRulesForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    return [...store.pointConversionRules]
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return Number(a.yenAmount) - Number(b.yenAmount);
      })
      .map((rule) => ({
        id: rule.id,
        yenAmount: rule.yenAmount,
        points: rule.points,
        isActive: rule.isActive,
      }));
  });
}

export async function getReservationPolicy() {
  return enqueue(async () => {
    const store = await readStore();
    ensureReservationPolicy(store);
    return {
      scope: store.reservationPolicy.scope,
      instructorAssignmentMode: normalizeInstructorAssignmentMode(
        store.reservationPolicy.instructorAssignmentMode
      ),
      timeGenerationMode: normalizeTimeGenerationMode(store.reservationPolicy.timeGenerationMode),
      operatingStartTime: normalizeClockTime(store.reservationPolicy.operatingStartTime, "10:00"),
      operatingEndTime: normalizeClockTime(store.reservationPolicy.operatingEndTime, "19:00"),
      prepMinutes: Math.max(0, Number(store.reservationPolicy.prepMinutes || 10)),
      courseDurations: normalizeCourseDurations(store.reservationPolicy.courseDurations),
      useClassroomHoursForSlotGeneration: store.reservationPolicy.useClassroomHoursForSlotGeneration !== false,
      updatedAt: store.reservationPolicy.updatedAt,
    };
  });
}

export async function updateReservationPolicyByAdmin(patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureReservationPolicy(store);
    const previousMode = store.reservationPolicy.instructorAssignmentMode;
    const nextMode = normalizeInstructorAssignmentMode(patch?.instructorAssignmentMode);
    store.reservationPolicy.instructorAssignmentMode = nextMode;
    if (patch?.timeGenerationMode !== undefined) {
      store.reservationPolicy.timeGenerationMode = normalizeTimeGenerationMode(patch.timeGenerationMode);
    }
    if (patch?.operatingStartTime !== undefined) {
      store.reservationPolicy.operatingStartTime = normalizeClockTime(
        patch.operatingStartTime,
        store.reservationPolicy.operatingStartTime || "10:00"
      );
    }
    if (patch?.operatingEndTime !== undefined) {
      store.reservationPolicy.operatingEndTime = normalizeClockTime(
        patch.operatingEndTime,
        store.reservationPolicy.operatingEndTime || "19:00"
      );
    }
    if (
      timeToMinutes(store.reservationPolicy.operatingEndTime) <=
      timeToMinutes(store.reservationPolicy.operatingStartTime)
    ) {
      throw new Error("運営終了時間は開始時間より後である必要があります。");
    }
    if (patch?.prepMinutes !== undefined) {
      store.reservationPolicy.prepMinutes = Math.max(0, Number(patch.prepMinutes || 0));
    }
    if (patch?.courseDurations !== undefined) {
      store.reservationPolicy.courseDurations = normalizeCourseDurations(patch.courseDurations);
    }
    if (patch?.useClassroomHoursForSlotGeneration !== undefined) {
      store.reservationPolicy.useClassroomHoursForSlotGeneration = patch.useClassroomHoursForSlotGeneration === true;
    }
    store.reservationPolicy.updatedAt = nowIso();
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.policy_updated",
      targetType: "reservation_policy",
      targetId: "global",
      summary: "Admin updated reservation policy",
      meta: {
        previousInstructorAssignmentMode: previousMode,
        instructorAssignmentMode: nextMode,
        timeGenerationMode: store.reservationPolicy.timeGenerationMode,
        operatingStartTime: store.reservationPolicy.operatingStartTime,
        operatingEndTime: store.reservationPolicy.operatingEndTime,
        prepMinutes: store.reservationPolicy.prepMinutes,
        courseDurations: store.reservationPolicy.courseDurations,
        useClassroomHoursForSlotGeneration: store.reservationPolicy.useClassroomHoursForSlotGeneration,
      },
    });
    await writeStore(store);
    return {
      scope: store.reservationPolicy.scope,
      instructorAssignmentMode: store.reservationPolicy.instructorAssignmentMode,
      timeGenerationMode: store.reservationPolicy.timeGenerationMode,
      operatingStartTime: store.reservationPolicy.operatingStartTime,
      operatingEndTime: store.reservationPolicy.operatingEndTime,
      prepMinutes: store.reservationPolicy.prepMinutes,
      courseDurations: store.reservationPolicy.courseDurations,
      useClassroomHoursForSlotGeneration: store.reservationPolicy.useClassroomHoursForSlotGeneration !== false,
      updatedAt: store.reservationPolicy.updatedAt,
    };
  });
}

function flattenSectionDiff(sectionName, beforeSection = {}, afterSection = {}) {
  const keys = [...new Set([...Object.keys(beforeSection || {}), ...Object.keys(afterSection || {})])];
  return keys
    .filter((key) => JSON.stringify(beforeSection?.[key]) !== JSON.stringify(afterSection?.[key]))
    .map((key) => ({
      section: sectionName,
      key,
      before: beforeSection?.[key],
      after: afterSection?.[key],
    }));
}

export async function getSystemSettingsForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    return JSON.parse(JSON.stringify(store.systemSettings));
  });
}

/** 学生・講師・保護者ポータル：教室の週次営業時間（表示専用・JSON生データなし） */
export async function getClassroomWeekHoursForPortal() {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const co = store.systemSettings?.classroomOperations || {};
    const sb = store.systemSettings?.schoolBasic || {};
    return buildClassroomWeekPortalRows(co, sb);
  });
}

export async function getMailRuntimePolicy() {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    return {
      sendMode: String(store.systemSettings?.mail?.sendMode || "").trim().toLowerCase() || "log",
    };
  });
}

export async function updateSystemSettingsSectionByAdmin(section, patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const sectionName = String(section || "").trim();
    const allowedSections = [
      "schoolBasic",
      "reservation",
      "lesson",
      "homework",
      "notifications",
      "mail",
      "security",
      "parent",
      "pair",
      "classroomOperations",
      "lessonServiceCatalog",
      "teacherSchedulePolicy",
      "paymentMethodsPolicy",
    ];
    if (!allowedSections.includes(sectionName)) throw new Error("未対応の設定セクションです。");
    const isSuperAdmin = String(actor?.adminRank || "").toUpperCase() === "SUPER_ADMIN";
    const superAdminOnly = new Set(["mail", "security"]);
    if (superAdminOnly.has(sectionName) && !isSuperAdmin) {
      throw new Error("この設定はSUPER ADMINのみ変更できます。");
    }
    const before = JSON.parse(JSON.stringify(store.systemSettings[sectionName] || {}));
    const merged = { ...(store.systemSettings[sectionName] || {}), ...(patch || {}) };
    if (sectionName === "lesson" && patch?.defaultLessonDurations !== undefined) {
      merged.defaultLessonDurations = normalizeCourseDurations(patch.defaultLessonDurations);
    }
    if (sectionName === "reservation") {
      merged.operatingStartTime = normalizeClockTime(merged.operatingStartTime, "10:00");
      merged.operatingEndTime = normalizeClockTime(merged.operatingEndTime, "19:00");
      merged.timeGenerationMode = normalizeTimeGenerationMode(merged.timeGenerationMode);
      merged.prepMinutes = Math.max(0, Number(merged.prepMinutes || 0));
      merged.maxBookableDays = Math.max(1, Number(merged.maxBookableDays || 30));
      merged.cancelCutoffHours = Math.max(0, Number(merged.cancelCutoffHours || 0));
      const am = String(merged.approvalMode || "admin").trim();
      merged.approvalMode = am === "auto" ? "auto" : "admin";
      merged.calendarDisplayShowCancelled = merged.calendarDisplayShowCancelled === true;
      merged.studentChangeDeadlineDays = Math.max(0, Math.min(60, Number(merged.studentChangeDeadlineDays ?? 3)));
      merged.minBookingLeadMinutes = Math.max(0, Number(merged.minBookingLeadMinutes || 0));
      merged.useClassroomHoursForSlotGeneration = merged.useClassroomHoursForSlotGeneration !== false;
      merged.adminOverrideSameDay = merged.adminOverrideSameDay !== false;
      merged.studentUiShowExpectedPoints = merged.studentUiShowExpectedPoints === true;
      merged.studentUiShowBalanceAfterBooking = merged.studentUiShowBalanceAfterBooking === true;
    }
    if (sectionName === "lessonServiceCatalog") {
      if (!Array.isArray(merged.services)) merged.services = [];
      merged.services = merged.services
        .map((s) => normalizeLessonServiceCatalogEntry(s))
        .sort((a, b) =>
          a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : String(a.name || "").localeCompare(String(b.name || ""))
        );
    }
    if (sectionName === "paymentMethodsPolicy") {
      if (!Array.isArray(merged.methods)) merged.methods = [];
      merged.methods = merged.methods.map((m) => ({
        id: String(m?.id || "").trim() || "custom",
        labelJa: String(m?.labelJa || "").trim() || "支払い",
        enabled: m?.enabled === true,
        showToStudent: m?.showToStudent !== false,
        requiresAdminConfirm: m?.requiresAdminConfirm === true,
        description: String(m?.description || "").trim(),
        webProvider: String(m?.webProvider || "none").trim(),
      }));
      merged.webProvidersPrepared = {
        square: merged?.webProvidersPrepared?.square === true,
        stripe: merged?.webProvidersPrepared?.stripe === true,
      };
      merged.inClassFlowNote = String(merged.inClassFlowNote || "").trim();
    }
    if (sectionName === "security") {
      merged.loginAttemptLimit = Math.max(1, Number(merged.loginAttemptLimit || 5));
    }
    store.systemSettings[sectionName] = merged;

    if (sectionName === "reservation") {
      ensureReservationPolicy(store);
      store.reservationPolicy.timeGenerationMode = normalizeTimeGenerationMode(merged.timeGenerationMode);
      store.reservationPolicy.operatingStartTime = normalizeClockTime(merged.operatingStartTime, "10:00");
      store.reservationPolicy.operatingEndTime = normalizeClockTime(merged.operatingEndTime, "19:00");
      store.reservationPolicy.prepMinutes = Math.max(0, Number(merged.prepMinutes || 10));
      store.reservationPolicy.useClassroomHoursForSlotGeneration = merged.useClassroomHoursForSlotGeneration !== false;
      store.reservationPolicy.updatedAt = nowIso();
    }
    if (sectionName === "lesson") {
      ensureReservationPolicy(store);
      if (Array.isArray(merged.defaultLessonDurations) && merged.defaultLessonDurations.length > 0) {
        store.reservationPolicy.courseDurations = normalizeCourseDurations(merged.defaultLessonDurations);
        store.reservationPolicy.updatedAt = nowIso();
      }
    }

    const changedFields = flattenSectionDiff(sectionName, before, merged);
    if (changedFields.length === 0) {
      return {
        section: sectionName,
        settings: JSON.parse(JSON.stringify(merged)),
        changedFields: [],
      };
    }

    const logAt = nowIso();
    const logEntry = {
      id: newId(),
      changedAt: logAt,
      changedByUserId: actor?.userId || null,
      changedByRole: actor?.role || "admin",
      changedByAdminRank: actor?.adminRank || "ADMIN",
      section: sectionName,
      changedFields,
    };
    store.systemSettingLogs.push(logEntry);
    if (store.systemSettingLogs.length > 2000) {
      store.systemSettingLogs = store.systemSettingLogs.slice(-2000);
    }

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "system_setting.updated",
      targetType: "system_setting",
      targetId: sectionName,
      summary: `Updated system setting section: ${sectionName}`,
      meta: { changedFields: changedFields.map((field) => field.key) },
    });

    await writeStore(store);
    return {
      section: sectionName,
      settings: JSON.parse(JSON.stringify(merged)),
      changedFields,
    };
  });
}

export async function listSystemSettingLogsForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const userMap = new Map((store.users || []).map((user) => [user.id, user]));
    const section = String(filters?.section || "").trim();
    let rows = [...(store.systemSettingLogs || [])].sort((a, b) =>
      String(b.changedAt || "").localeCompare(String(a.changedAt || ""))
    );
    if (section) rows = rows.filter((item) => item.section === section);
    const { items, pagination } = paginate(
      rows,
      Number(filters?.page || 1),
      Number(filters?.pageSize || 30)
    );
    return {
      items: items.map((item) => ({
        ...item,
        changedByName:
          userMap.get(item.changedByUserId)?.displayName ||
          userMap.get(item.changedByUserId)?.email ||
          item.changedByUserId ||
          "-",
      })),
      pagination,
    };
  });
}

export async function getSystemInfoSummaryForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    const version = String(store.version || 1);
    const lastDeployAt = String(store.auditLogs?.slice(-1)?.[0]?.at || "");
    return {
      systemVersion: version,
      lastDeployAt: lastDeployAt || null,
      studentCount: (store.students || []).length,
      parentCount: (store.users || []).filter((user) => user.role === "parent").length,
      teacherCount: (store.users || []).filter((user) => user.role === "teacher").length,
      reservationCount: (store.reservations || []).length,
      lessonNoteCount: (store.lessonNotes || []).length,
      homeworkCount: (store.homeworks || []).length,
      mailCount: (store.mailLogs || []).length,
    };
  });
}

export async function listPointTimeConversionRulesForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    return [...store.pointTimeConversionRules]
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return Number(a.pointAmount) - Number(b.pointAmount);
      })
      .map((rule) => ({
        id: rule.id,
        pointAmount: rule.pointAmount,
        minutes: rule.minutes,
        isActive: rule.isActive,
      }));
  });
}

export async function updatePointConversionRulesForAdmin(nextRules = [], actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const now = nowIso();
    const normalized = nextRules
      .map((rule) => ({
        id: rule?.id || newId(),
        yenAmount: Math.max(1, Number(rule?.yenAmount || 1)),
        points: Math.max(1, Number(rule?.points || 1)),
        isActive: rule?.isActive !== false,
        createdAt: now,
        updatedAt: now,
      }))
      .slice(0, 20);

    if (normalized.length === 0) {
      throw new Error("At least one conversion rule is required.");
    }

    store.pointConversionRules = normalized;
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "admin.point_rules_updated",
      targetType: "point_rule",
      summary: "Admin updated point conversion rules",
      meta: { count: normalized.length },
    });
    await writeStore(store);
    return normalized.map((rule) => ({
      id: rule.id,
      yenAmount: rule.yenAmount,
      points: rule.points,
      isActive: rule.isActive,
    }));
  });
}

export async function updatePointTimeConversionRulesForAdmin(nextRules = [], actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const now = nowIso();
    const normalized = nextRules
      .map((rule) => ({
        id: rule?.id || newId(),
        pointAmount: Math.max(1, Number(rule?.pointAmount || 1)),
        minutes: Math.max(1, Number(rule?.minutes || 1)),
        isActive: rule?.isActive !== false,
        createdAt: now,
        updatedAt: now,
      }))
      .slice(0, 20);

    if (normalized.length === 0) {
      throw new Error("At least one point-to-minute rule is required.");
    }

    store.pointTimeConversionRules = normalized;
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "admin.point_time_rules_updated",
      targetType: "point_time_rule",
      summary: "Admin updated point-to-minute conversion rules",
      meta: { count: normalized.length },
    });
    await writeStore(store);
    return normalized.map((rule) => ({
      id: rule.id,
      pointAmount: rule.pointAmount,
      minutes: rule.minutes,
      isActive: rule.isActive,
    }));
  });
}

function resolveStudentIdsForLessonUnit(store, lessonUnitId) {
  const byReservations = store.reservations
    .filter((reservation) => String(reservation.lessonUnitId || "") === String(lessonUnitId || ""))
    .map((reservation) => reservation.studentId)
    .filter(Boolean);
  return [...new Set(byReservations)];
}

function parseStudentIds(input = []) {
  if (Array.isArray(input)) {
    return [...new Set(input.map((v) => String(v || "").trim()).filter(Boolean))];
  }
  const raw = String(input || "").trim();
  if (!raw) return [];
  return [...new Set(raw.split(",").map((v) => String(v || "").trim()).filter(Boolean))];
}

function toLessonNoteDto(store, note) {
  const links = store.lessonNoteStudents.filter((link) => link.lessonNoteId === note.id);
  const teacher = store.users.find((user) => user.id === note.teacherUserId) || null;
  const students = links
    .map((link) => store.students.find((student) => student.id === link.studentId))
    .filter(Boolean)
    .map((student) => ({
      id: student.id,
      nameKanji: student.nameKanji || "",
      studentNumber: student.studentNumber || null,
    }));
  return {
    id: note.id,
    lessonUnitId: note.lessonUnitId || null,
    reservationSlotId: note.reservationSlotId || null,
    teacherUserId: note.teacherUserId || null,
    teacherName: teacher?.displayName || teacher?.email || null,
    date: note.date || null,
    title: note.title || "",
    summary: note.summary || "",
    content: note.content || "",
    homeworkSummary: note.homeworkSummary || "",
    nextLessonPlan: note.nextLessonPlan || "",
    isSharedToStudents: note.isSharedToStudents !== false,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    students,
    studentCount: students.length,
  };
}

export async function getLessonNoteNotificationTargets(noteId) {
  return enqueue(async () => {
    const store = await readStore();
    const note = store.lessonNotes.find((item) => item.id === String(noteId || "").trim()) || null;
    if (!note) return null;

    const teacherUser =
      store.users.find((user) => user.id === String(note.teacherUserId || "").trim()) || null;
    const links = store.lessonNoteStudents.filter(
      (link) =>
        link.lessonNoteId === note.id &&
        link.isVisibleToStudent !== false &&
        String(link.studentId || "").trim(),
    );

    const studentTargets = [];
    const parentTargets = [];
    const seenParentUserIds = new Set();

    links.forEach((link) => {
      const student = store.students.find((item) => item.id === link.studentId) || null;
      if (!student) return;

      const studentUserLink = store.userStudentLinks.find((item) => item.studentId === student.id) || null;
      const studentUser = studentUserLink
        ? store.users.find((user) => user.id === studentUserLink.userId && user.status !== "inactive") || null
        : null;
      if (studentUser?.email) {
        studentTargets.push({
          studentId: student.id,
          studentName: student.nameKanji || "",
          email: studentUser.email,
        });
      }

      if (!student.isMinor) return;

      const parentLinks = store.studentParents.filter(
        (parentLink) =>
          parentLink.studentId === student.id &&
          parentLink.status === "active" &&
          parentLink.canViewLessonNotes !== false &&
          parentLink.canReceiveNotifications !== false,
      );
      parentLinks.forEach((parentLink) => {
        if (seenParentUserIds.has(parentLink.parentUserId)) return;
        const parentUser =
          store.users.find(
            (user) =>
              user.id === parentLink.parentUserId &&
              user.role === "parent" &&
              user.status !== "inactive" &&
              user.email,
          ) || null;
        if (!parentUser) return;
        seenParentUserIds.add(parentUser.id);
        parentTargets.push({
          parentUserId: parentUser.id,
          email: parentUser.email,
          studentId: student.id,
          studentName: student.nameKanji || "",
        });
      });
    });

    return {
      note: {
        id: note.id,
        lessonUnitId: note.lessonUnitId || null,
        date: note.date || null,
        title: note.title || "",
        summary: note.summary || "",
        content: note.content || "",
        homeworkSummary: note.homeworkSummary || "",
      },
      teacherName: teacherUser?.displayName || teacherUser?.email || "",
      studentTargets,
      parentTargets,
    };
  });
}

export async function listLessonNotesForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const lessonUnitId = String(filters?.lessonUnitId || "").trim();
    const teacherUserId = String(filters?.teacherUserId || "").trim();
    const studentId = String(filters?.studentId || "").trim();
    const unassignedTeacherOnly = Boolean(filters?.unassignedTeacherOnly);
    const rows = store.lessonNotes
      .filter((note) => (lessonUnitId ? String(note.lessonUnitId || "") === lessonUnitId : true))
      .filter((note) => (teacherUserId ? String(note.teacherUserId || "") === teacherUserId : true))
      .filter((note) =>
        studentId
          ? store.lessonNoteStudents.some(
              (link) => link.lessonNoteId === note.id && String(link.studentId || "") === studentId
            )
          : true
      )
      .filter((note) =>
        unassignedTeacherOnly ? !String(note.teacherUserId || "").trim() : true
      )
      .sort((a, b) => String(b.date || b.updatedAt || "").localeCompare(String(a.date || a.updatedAt || "")))
      .map((note) => toLessonNoteDto(store, note));
    return rows;
  });
}

export async function createLessonNoteByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const ts = nowIso();
    const lessonUnitId = String(payload?.lessonUnitId || "").trim();
    if (!lessonUnitId) throw new Error("lessonUnitId は必須です。");
    const title = String(payload?.title || "").trim() || "レッスンノート";
    const actorRole = String(actor?.role || "").trim();
    const resolvedTeacherUserId =
      actorRole === "teacher"
        ? String(actor?.userId || "").trim() || null
        : String(payload?.teacherUserId || actor?.userId || "").trim() || null;

    const note = {
      id: newId(),
      lessonUnitId,
      reservationSlotId: String(payload?.reservationSlotId || "").trim() || null,
      teacherUserId: resolvedTeacherUserId,
      date: String(payload?.date || "").trim(),
      title,
      summary: String(payload?.summary || "").trim(),
      content: String(payload?.content || "").trim(),
      homeworkSummary: String(payload?.homeworkSummary || "").trim(),
      nextLessonPlan: String(payload?.nextLessonPlan || "").trim(),
      isSharedToStudents: payload?.isSharedToStudents !== false,
      createdAt: ts,
      updatedAt: ts,
    };
    migrateLessonNoteShape(note);
    store.lessonNotes.push(note);

    const explicitStudentIds = parseStudentIds(payload?.studentIds || []);
    const inferredStudentIds = resolveStudentIdsForLessonUnit(store, lessonUnitId);
    const targetStudentIds = [...new Set([...(explicitStudentIds || []), ...(inferredStudentIds || [])])];
    targetStudentIds.forEach((studentId) => {
      const exists = store.students.some((student) => student.id === studentId);
      if (!exists) return;
      const link = {
        id: newId(),
        lessonNoteId: note.id,
        studentId,
        reservationId: null,
        isVisibleToStudent: true,
        studentPrivateMemo: "",
        studentFeedbackSummary: "",
        createdAt: ts,
        updatedAt: ts,
      };
      migrateLessonNoteStudentShape(link);
      store.lessonNoteStudents.push(link);
    });

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "lesson_note.created",
      targetType: "lesson_note",
      targetId: note.id,
      summary: `Lesson note created ${note.id}`,
      meta: { lessonUnitId: note.lessonUnitId, studentCount: targetStudentIds.length },
    });
    await writeStore(store);
    return toLessonNoteDto(store, note);
  });
}

export async function updateLessonNoteByAdmin(noteId, patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const note = store.lessonNotes.find((item) => item.id === noteId);
    if (!note) return null;
    if (actor?.role === "teacher" && String(note.teacherUserId || "") !== String(actor?.userId || "")) {
      return null;
    }

    if (patch?.title !== undefined) note.title = String(patch.title || "").trim() || note.title;
    if (patch?.summary !== undefined) note.summary = String(patch.summary || "").trim();
    if (patch?.content !== undefined) note.content = String(patch.content || "").trim();
    if (patch?.homeworkSummary !== undefined) note.homeworkSummary = String(patch.homeworkSummary || "").trim();
    if (patch?.nextLessonPlan !== undefined) note.nextLessonPlan = String(patch.nextLessonPlan || "").trim();
    if (patch?.isSharedToStudents !== undefined) note.isSharedToStudents = patch.isSharedToStudents !== false;
    if (patch?.date !== undefined) note.date = String(patch.date || "").trim();
    if (patch?.lessonUnitId !== undefined) note.lessonUnitId = String(patch.lessonUnitId || "").trim();
    note.updatedAt = nowIso();
    migrateLessonNoteShape(note);

    if (patch?.studentIds !== undefined) {
      const studentIds = parseStudentIds(patch.studentIds);
      store.lessonNoteStudents = store.lessonNoteStudents.filter(
        (link) => !(link.lessonNoteId === note.id && !studentIds.includes(link.studentId))
      );
      studentIds.forEach((studentId) => {
        const exists = store.students.some((student) => student.id === studentId);
        if (!exists) return;
        const current =
          store.lessonNoteStudents.find((link) => link.lessonNoteId === note.id && link.studentId === studentId) || null;
        if (current) {
          current.updatedAt = nowIso();
          return;
        }
        const link = {
          id: newId(),
          lessonNoteId: note.id,
          studentId,
          reservationId: null,
          isVisibleToStudent: true,
          studentPrivateMemo: "",
          studentFeedbackSummary: "",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        migrateLessonNoteStudentShape(link);
        store.lessonNoteStudents.push(link);
      });
    }

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "lesson_note.updated",
      targetType: "lesson_note",
      targetId: note.id,
      summary: `Lesson note updated ${note.id}`,
      meta: { lessonUnitId: note.lessonUnitId },
    });
    await writeStore(store);
    return toLessonNoteDto(store, note);
  });
}

export async function deleteLessonNoteByAdmin(noteId, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const target = store.lessonNotes.find((note) => note.id === noteId);
    if (!target) return false;
    if (actor?.role === "teacher" && String(target.teacherUserId || "") !== String(actor?.userId || "")) {
      return false;
    }
    const before = store.lessonNotes.length;
    store.lessonNotes = store.lessonNotes.filter((note) => note.id !== noteId);
    if (store.lessonNotes.length === before) return false;
    store.lessonNoteStudents = store.lessonNoteStudents.filter((link) => link.lessonNoteId !== noteId);
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "lesson_note.deleted",
      targetType: "lesson_note",
      targetId: noteId,
      summary: `Lesson note deleted ${noteId}`,
      meta: {},
    });
    await writeStore(store);
    return true;
  });
}

function toHomeworkDto(store, homework) {
  const student = store.students.find((item) => item.id === homework.studentId) || null;
  const teacher = store.users.find((item) => item.id === homework.teacherUserId) || null;
  const linkedNote =
    homework.lessonUnitId
      ? store.lessonNotes.find((note) => String(note.lessonUnitId || "") === String(homework.lessonUnitId || ""))
      : null;
  const dueDateMs = parseDateMs(homework.dueDate || "");
  const isDone = ["reviewed", "completed"].includes(String(homework.status || ""));
  const isOverdue = Boolean(dueDateMs !== null && dueDateMs < Date.now() && !isDone);
  return {
    id: homework.id,
    studentId: homework.studentId,
    studentName: student?.nameKanji || "",
    studentNumber: student?.studentNumber || null,
    lessonUnitId: homework.lessonUnitId || null,
    reservationId: homework.reservationId || null,
    lessonDate: homework.lessonDate || null,
    teacherUserId: homework.teacherUserId || null,
    teacherName: teacher?.displayName || teacher?.email || null,
    title: homework.title || "",
    description: homework.description || "",
    type: homework.type || "free",
    status: homework.status || "not_started",
    teacherMemo: homework.teacherMemo || "",
    studentMemo: homework.studentMemo || "",
    dueDate: homework.dueDate || null,
    isPublished: homework.isPublished !== false,
    isOverdue,
    submittedAt: homework.submittedAt || null,
    reviewedAt: homework.reviewedAt || null,
    completedAt: homework.completedAt || null,
    createdAt: homework.createdAt || null,
    updatedAt: homework.updatedAt || null,
    relatedLessonNoteId: linkedNote?.id || null,
  };
}

export async function listHomeworksForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const query = String(filters?.query || "").trim().toLowerCase();
    const studentId = String(filters?.studentId || "").trim();
    const teacherUserId = String(filters?.teacherUserId || "").trim();
    const status = normalizeHomeworkStatus(filters?.status || "");
    const statusFilter = String(filters?.status || "").trim() ? status : "";
    const typeFilter = String(filters?.type || "").trim();
    const lessonUnitId = String(filters?.lessonUnitId || "").trim();
    const fromDate = normalizeReservationDate(filters?.fromDate || "");
    const toDate = normalizeReservationDate(filters?.toDate || "");
    const publishedOnly = Boolean(filters?.publishedOnly);
    const rows = store.homeworks
      .filter((item) => (studentId ? item.studentId === studentId : true))
      .filter((item) => (teacherUserId ? String(item.teacherUserId || "") === teacherUserId : true))
      .filter((item) => (statusFilter ? String(item.status || "") === statusFilter : true))
      .filter((item) => (typeFilter ? String(item.type || "") === typeFilter : true))
      .filter((item) => (lessonUnitId ? String(item.lessonUnitId || "") === lessonUnitId : true))
      .filter((item) => (publishedOnly ? item.isPublished !== false : true))
      .filter((item) => (fromDate ? String(item.lessonDate || item.createdAt || "").slice(0, 10) >= fromDate : true))
      .filter((item) => (toDate ? String(item.lessonDate || item.createdAt || "").slice(0, 10) <= toDate : true))
      .map((item) => toHomeworkDto(store, item))
      .filter((item) => {
        if (!query) return true;
        const target = [
          item.studentName,
          item.studentNumber,
          item.title,
          item.description,
          item.teacherName,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        return target.includes(query);
      })
      .sort((a, b) =>
        String(b.lessonDate || b.createdAt || "").localeCompare(String(a.lessonDate || a.createdAt || ""))
      );
    return rows;
  });
}

function toHomeworkTemplateDto(template) {
  return {
    id: template.id,
    title: template.title || "",
    description: template.description || "",
    type: template.type || "free",
    teacherMemo: template.teacherMemo || "",
    createdByUserId: template.createdByUserId || null,
    updatedByUserId: template.updatedByUserId || null,
    createdAt: template.createdAt || null,
    updatedAt: template.updatedAt || null,
  };
}

export async function listHomeworkTemplates(actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const isTeacher = String(actor?.role || "") === "teacher";
    return store.homeworkTemplates
      .filter((template) => (isTeacher ? String(template.createdByUserId || "") === String(actor?.userId || "") : true))
      .map((template) => toHomeworkTemplateDto(template))
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  });
}

export async function createHomeworkTemplate(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const ts = nowIso();
    const template = {
      id: newId(),
      title: String(payload?.title || "").trim() || "宿題テンプレート",
      description: String(payload?.description || "").trim(),
      type: normalizeHomeworkType(payload?.type),
      teacherMemo: String(payload?.teacherMemo || "").trim(),
      createdByUserId: String(actor?.userId || "").trim() || null,
      updatedByUserId: String(actor?.userId || "").trim() || null,
      createdAt: ts,
      updatedAt: ts,
    };
    migrateHomeworkTemplateShape(template);
    store.homeworkTemplates.push(template);
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "homework_template.created",
      targetType: "homework_template",
      targetId: template.id,
      summary: `Homework template created ${template.id}`,
      meta: { title: template.title, type: template.type },
    });
    await writeStore(store);
    return toHomeworkTemplateDto(template);
  });
}

export async function deleteHomeworkTemplate(templateId, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const target =
      store.homeworkTemplates.find((item) => item.id === String(templateId || "").trim()) || null;
    if (!target) return false;
    if (
      String(actor?.role || "") === "teacher" &&
      String(target.createdByUserId || "") !== String(actor?.userId || "")
    ) {
      return false;
    }
    const before = store.homeworkTemplates.length;
    store.homeworkTemplates = store.homeworkTemplates.filter((item) => item.id !== target.id);
    if (store.homeworkTemplates.length === before) return false;
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "homework_template.deleted",
      targetType: "homework_template",
      targetId: target.id,
      summary: `Homework template deleted ${target.id}`,
      meta: {},
    });
    await writeStore(store);
    return true;
  });
}

export async function createHomeworkByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const ts = nowIso();
    const studentId = String(payload?.studentId || "").trim();
    if (!studentId) throw new Error("studentId は必須です。");
    const student = store.students.find((item) => item.id === studentId) || null;
    if (!student) throw new Error("対象の学生が見つかりません。");

    const actorRole = String(actor?.role || "").trim();
    const resolvedTeacherUserId =
      actorRole === "teacher"
        ? String(actor?.userId || "").trim() || null
        : String(payload?.teacherUserId || actor?.userId || "").trim() || null;

    const item = {
      id: newId(),
      studentId,
      lessonUnitId: String(payload?.lessonUnitId || "").trim() || null,
      reservationId: String(payload?.reservationId || "").trim() || null,
      lessonDate: normalizeReservationDate(payload?.lessonDate || "") || null,
      teacherUserId: resolvedTeacherUserId,
      title: String(payload?.title || "").trim() || "宿題",
      description: String(payload?.description || "").trim(),
      type: normalizeHomeworkType(payload?.type),
      status: normalizeHomeworkStatus(payload?.status),
      teacherMemo: String(payload?.teacherMemo || "").trim(),
      studentMemo: "",
      dueDate: normalizeReservationDate(payload?.dueDate || "") || null,
      isPublished: payload?.isPublished !== false,
      submittedAt: null,
      reviewedAt: null,
      completedAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    migrateHomeworkShape(item);
    store.homeworks.push(item);

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "homework.created",
      targetType: "homework",
      targetId: item.id,
      summary: `Homework created ${item.id}`,
      meta: {
        studentId: item.studentId,
        lessonUnitId: item.lessonUnitId,
        status: item.status,
        isPublished: item.isPublished,
      },
    });

    await writeStore(store);
    return toHomeworkDto(store, item);
  });
}

export async function updateHomeworkByAdmin(homeworkId, patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const item = store.homeworks.find((homework) => homework.id === String(homeworkId || "").trim()) || null;
    if (!item) return null;
    if (actor?.role === "teacher" && String(item.teacherUserId || "") !== String(actor?.userId || "")) {
      return null;
    }
    if (patch?.title !== undefined) item.title = String(patch.title || "").trim() || item.title;
    if (patch?.description !== undefined) item.description = String(patch.description || "").trim();
    if (patch?.type !== undefined) item.type = normalizeHomeworkType(patch.type);
    if (patch?.status !== undefined) item.status = normalizeHomeworkStatus(patch.status);
    if (patch?.teacherMemo !== undefined) item.teacherMemo = String(patch.teacherMemo || "").trim();
    if (patch?.dueDate !== undefined) item.dueDate = normalizeReservationDate(patch.dueDate || "") || null;
    if (patch?.lessonDate !== undefined) item.lessonDate = normalizeReservationDate(patch.lessonDate || "") || null;
    if (patch?.isPublished !== undefined) item.isPublished = patch.isPublished !== false;
    if (patch?.lessonUnitId !== undefined) item.lessonUnitId = String(patch.lessonUnitId || "").trim() || null;
    if (patch?.reservationId !== undefined) item.reservationId = String(patch.reservationId || "").trim() || null;
    if (patch?.teacherUserId !== undefined && actor?.role !== "teacher") {
      item.teacherUserId = String(patch.teacherUserId || "").trim() || null;
    }
    if (item.status === "submitted" && !item.submittedAt) item.submittedAt = nowIso();
    if (item.status === "reviewed" && !item.reviewedAt) item.reviewedAt = nowIso();
    if (item.status === "completed" && !item.completedAt) item.completedAt = nowIso();
    item.updatedAt = nowIso();
    migrateHomeworkShape(item);

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "homework.updated",
      targetType: "homework",
      targetId: item.id,
      summary: `Homework updated ${item.id}`,
      meta: {
        studentId: item.studentId,
        status: item.status,
        isPublished: item.isPublished,
      },
    });
    await writeStore(store);
    return toHomeworkDto(store, item);
  });
}

export async function bulkUpdateHomeworkStatusByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const homeworkIds = Array.isArray(payload?.homeworkIds)
      ? payload.homeworkIds.map((id) => String(id || "").trim()).filter(Boolean)
      : [];
    if (homeworkIds.length === 0) throw new Error("homeworkIds は必須です。");
    const nextStatus = normalizeHomeworkStatus(payload?.status);
    const updated = [];
    homeworkIds.forEach((homeworkId) => {
      const item = store.homeworks.find((homework) => homework.id === homeworkId) || null;
      if (!item) return;
      if (actor?.role === "teacher" && String(item.teacherUserId || "") !== String(actor?.userId || "")) return;
      item.status = nextStatus;
      if (nextStatus === "submitted" && !item.submittedAt) item.submittedAt = nowIso();
      if (nextStatus === "reviewed" && !item.reviewedAt) item.reviewedAt = nowIso();
      if (nextStatus === "completed" && !item.completedAt) item.completedAt = nowIso();
      item.updatedAt = nowIso();
      migrateHomeworkShape(item);
      updated.push(toHomeworkDto(store, item));
    });
    if (updated.length > 0) {
      writeAuditLog(store, {
        actorUserId: actor?.userId || null,
        actorRole: actor?.role || "admin",
        action: "homework.bulk_status_updated",
        targetType: "homework",
        targetId: null,
        summary: `Bulk homework status updated ${updated.length}`,
        meta: { status: nextStatus, count: updated.length },
      });
      await writeStore(store);
    }
    return {
      updatedCount: updated.length,
      updated,
    };
  });
}

export async function deleteHomeworkByAdmin(homeworkId, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const target = store.homeworks.find((item) => item.id === String(homeworkId || "").trim()) || null;
    if (!target) return false;
    if (actor?.role === "teacher" && String(target.teacherUserId || "") !== String(actor?.userId || "")) {
      return false;
    }
    const before = store.homeworks.length;
    store.homeworks = store.homeworks.filter((item) => item.id !== target.id);
    if (store.homeworks.length === before) return false;
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "homework.deleted",
      targetType: "homework",
      targetId: target.id,
      summary: `Homework deleted ${target.id}`,
      meta: { studentId: target.studentId },
    });
    await writeStore(store);
    return true;
  });
}

export async function getHomeworkNotificationTargets(homeworkId) {
  return enqueue(async () => {
    const store = await readStore();
    const homework = store.homeworks.find((item) => item.id === String(homeworkId || "").trim()) || null;
    if (!homework) return null;
    const student = store.students.find((item) => item.id === homework.studentId) || null;
    if (!student) return null;
    const teacher = store.users.find((item) => item.id === homework.teacherUserId) || null;
    const userLink = store.userStudentLinks.find((item) => item.studentId === student.id) || null;
    const studentUser = userLink
      ? store.users.find((item) => item.id === userLink.userId && item.status !== "inactive") || null
      : null;
    const studentTarget = studentUser?.email
      ? {
          studentId: student.id,
          studentName: student.nameKanji || "",
          email: studentUser.email,
        }
      : null;

    const parentTargets = [];
    if (student.isMinor) {
      const links = store.studentParents.filter(
        (link) =>
          link.studentId === student.id &&
          link.status === "active" &&
          link.canViewHomework !== false &&
          link.canReceiveNotifications !== false
      );
      links.forEach((link) => {
        const parentUser =
          store.users.find(
            (user) =>
              user.id === link.parentUserId &&
              user.role === "parent" &&
              user.status !== "inactive" &&
              user.email
          ) || null;
        if (!parentUser) return;
        parentTargets.push({
          parentUserId: parentUser.id,
          email: parentUser.email,
          studentId: student.id,
          studentName: student.nameKanji || "",
        });
      });
    }
    return {
      homework: toHomeworkDto(store, homework),
      teacherName: teacher?.displayName || teacher?.email || "",
      studentTarget,
      parentTargets,
    };
  });
}

export async function listHomeworksForStudent(userId, filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    const status = String(filters?.status || "").trim();
    const rows = store.homeworks
      .filter((item) => item.studentId === student.id && item.isPublished !== false)
      .map((item) => toHomeworkDto(store, item))
      .filter((item) => (status ? item.status === normalizeHomeworkStatus(status) : true))
      .sort((a, b) =>
        String(b.lessonDate || b.createdAt || "").localeCompare(String(a.lessonDate || a.createdAt || ""))
      );
    return rows;
  });
}

export async function getHomeworkForStudent(userId, homeworkId) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    const item = store.homeworks.find((homework) => homework.id === String(homeworkId || "").trim()) || null;
    if (!item || item.studentId !== student.id || item.isPublished === false) return null;
    return toHomeworkDto(store, item);
  });
}

export async function updateHomeworkByStudent(userId, homeworkId, patch = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    const item = store.homeworks.find((homework) => homework.id === String(homeworkId || "").trim()) || null;
    if (!item || item.studentId !== student.id || item.isPublished === false) return null;

    const canStudentUpdateStatus = store.systemSettings?.homework?.allowStudentStatusUpdate !== false;
    const allowedStatuses = new Set(["not_started", "in_progress", "submitted"]);
    if (patch?.status !== undefined) {
      const nextStatus = normalizeHomeworkStatus(patch.status);
      if (canStudentUpdateStatus && allowedStatuses.has(nextStatus)) item.status = nextStatus;
      if (nextStatus === "submitted" && !item.submittedAt) item.submittedAt = nowIso();
    }
    if (patch?.studentMemo !== undefined) item.studentMemo = String(patch.studentMemo || "").trim();
    item.updatedAt = nowIso();
    migrateHomeworkShape(item);

    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "homework.student_updated",
      targetType: "homework",
      targetId: item.id,
      summary: `Student updated homework ${item.id}`,
      meta: { studentId: student.id, status: item.status },
    });
    await writeStore(store);
    return toHomeworkDto(store, item);
  });
}

export async function listHomeworksForParentChild(parentUserId, studentId) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    if (store.systemSettings?.parent?.parentAccountEnabled === false) {
      return {
        canView: false,
        items: [],
      };
    }
    const activeLink = listActiveParentLinksByUser(store, parentUserId).find(
      (link) => link.studentId === String(studentId || "").trim()
    );
    if (!activeLink) return null;
    const parentPolicy = getParentPolicySettings(store);
    const parentCanViewHomeworkBySystem = store.systemSettings?.homework?.allowParentHomeworkView !== false;
    if (!activeLink.canViewHomework || !parentCanViewHomeworkBySystem || parentPolicy.canViewHomework === false) {
      return {
        canView: false,
        items: [],
      };
    }
    const rows = store.homeworks
      .filter((item) => item.studentId === studentId && item.isPublished !== false)
      .map((item) => toHomeworkDto(store, item))
      .sort((a, b) =>
        String(b.lessonDate || b.createdAt || "").localeCompare(String(a.lessonDate || a.createdAt || ""))
      );
    return {
      canView: true,
      items: rows,
    };
  });
}

export async function getHomeworkForParentChild(parentUserId, studentId, homeworkId) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    if (store.systemSettings?.parent?.parentAccountEnabled === false) return null;
    const activeLink = listActiveParentLinksByUser(store, parentUserId).find(
      (link) => link.studentId === String(studentId || "").trim()
    );
    const parentPolicy = getParentPolicySettings(store);
    const parentCanViewHomeworkBySystem = store.systemSettings?.homework?.allowParentHomeworkView !== false;
    if (!activeLink || !activeLink.canViewHomework || !parentCanViewHomeworkBySystem || parentPolicy.canViewHomework === false) return null;
    const item = store.homeworks.find((homework) => homework.id === String(homeworkId || "").trim()) || null;
    if (!item || item.studentId !== String(studentId || "").trim() || item.isPublished === false) return null;
    return toHomeworkDto(store, item);
  });
}

export async function assignTeacherForUnassignedLessonNotesByAdmin(
  teacherUserId,
  options = {},
  actor = null
) {
  return enqueue(async () => {
    const store = await readStore();
    const targetTeacherUserId = String(teacherUserId || "").trim();
    if (!targetTeacherUserId) throw new Error("teacherUserId は必須です。");
    const teacher = store.users.find(
      (user) => user.id === targetTeacherUserId && user.role === "teacher" && user.status !== "inactive"
    );
    if (!teacher) throw new Error("有効な先生ユーザーが見つかりません。");

    const lessonUnitId = String(options?.lessonUnitId || "").trim();
    let updatedCount = 0;
    const updatedNoteIds = [];
    for (const note of store.lessonNotes) {
      if (lessonUnitId && String(note.lessonUnitId || "") !== lessonUnitId) continue;
      if (String(note.teacherUserId || "").trim()) continue;
      note.teacherUserId = targetTeacherUserId;
      note.updatedAt = nowIso();
      migrateLessonNoteShape(note);
      updatedCount += 1;
      updatedNoteIds.push(note.id);
    }

    if (updatedCount > 0) {
      writeAuditLog(store, {
        actorUserId: actor?.userId || null,
        actorRole: actor?.role || "admin",
        action: "lesson_note.teacher_assigned_bulk",
        targetType: "lesson_note",
        targetId: null,
        summary: `Bulk assigned teacher for ${updatedCount} lesson notes`,
        meta: {
          teacherUserId: targetTeacherUserId,
          updatedCount,
          lessonUnitId: lessonUnitId || null,
          noteIds: updatedNoteIds,
        },
      });
      await writeStore(store);
    }

    return {
      updatedCount,
      teacher: {
        id: teacher.id,
        displayName: teacher.displayName || teacher.email,
      },
      updatedNoteIdsPreview: updatedNoteIds.slice(0, 5),
      hasMoreUpdatedNoteIds: updatedNoteIds.length > 5,
    };
  });
}

export async function listNoticesForStudent(options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const limit = Math.max(1, Math.min(20, Number(options?.limit || 5)));
    return [...store.notices]
      .filter((notice) => notice.isActive)
      .sort((a, b) =>
        String(b.publishedAt || b.updatedAt || "").localeCompare(String(a.publishedAt || a.updatedAt || ""))
      )
      .slice(0, limit)
      .map((notice) => ({
        id: notice.id,
        title: notice.title,
        summary: notice.summary || "",
        content: notice.content || "",
        isImportant: Boolean(notice.isImportant),
        publishedAt: notice.publishedAt || null,
        updatedAt: notice.updatedAt,
      }));
  });
}

export async function getNoticeByIdForStudent(noticeId) {
  return enqueue(async () => {
    const store = await readStore();
    const notice = store.notices.find((item) => item.id === noticeId && item.isActive);
    if (!notice) return null;
    return {
      id: notice.id,
      title: notice.title,
      summary: notice.summary || "",
      content: notice.content,
      isImportant: Boolean(notice.isImportant),
      publishedAt: notice.publishedAt || null,
      updatedAt: notice.updatedAt,
    };
  });
}

export async function listNoticesForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    return [...store.notices]
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
      .map((notice) => ({
        id: notice.id,
        title: notice.title,
        summary: notice.summary || "",
        content: notice.content,
        isImportant: Boolean(notice.isImportant),
        isActive: Boolean(notice.isActive),
        publishedAt: notice.publishedAt || null,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
      }));
  });
}

export async function getNoticeByIdForAdmin(noticeId) {
  return enqueue(async () => {
    const store = await readStore();
    const notice = store.notices.find((item) => item.id === noticeId);
    if (!notice) return null;
    return {
      id: notice.id,
      title: notice.title,
      summary: notice.summary || "",
      content: notice.content,
      isImportant: Boolean(notice.isImportant),
      isActive: Boolean(notice.isActive),
      publishedAt: notice.publishedAt || null,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
    };
  });
}

export async function getNoticeNotificationTargets(noticeId) {
  return enqueue(async () => {
    const store = await readStore();
    const notice = store.notices.find((item) => item.id === String(noticeId || "").trim()) || null;
    if (!notice || notice.isActive === false) return null;

    const studentTargets = store.users
      .filter((user) => user.role === "student" && user.status !== "inactive" && user.email)
      .map((user) => {
        const link = store.userStudentLinks.find((item) => item.userId === user.id) || null;
        const student = link ? store.students.find((item) => item.id === link.studentId) || null : null;
        return {
          userId: user.id,
          email: user.email,
          studentId: student?.id || null,
          studentName: student?.nameKanji || user.displayName || "",
        };
      });

    const parentTargets = [];
    const seenParentUserIds = new Set();
    store.studentParents
      .filter((link) => link.status === "active" && link.canReceiveNotifications !== false)
      .forEach((link) => {
        if (seenParentUserIds.has(link.parentUserId)) return;
        const parentUser =
          store.users.find(
            (user) => user.id === link.parentUserId && user.role === "parent" && user.status !== "inactive" && user.email
          ) || null;
        if (!parentUser) return;
        const student = store.students.find((item) => item.id === link.studentId) || null;
        seenParentUserIds.add(parentUser.id);
        parentTargets.push({
          parentUserId: parentUser.id,
          email: parentUser.email,
          parentName: parentUser.displayName || parentUser.email,
          studentId: student?.id || null,
          studentName: student?.nameKanji || "",
        });
      });

    return {
      notice: {
        id: notice.id,
        title: notice.title || "",
        summary: notice.summary || "",
        content: notice.content || "",
      },
      studentTargets,
      parentTargets,
    };
  });
}

export async function createNoticeByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const now = nowIso();
    const title = String(payload?.title || "").trim();
    if (!title) throw new Error("タイトルは必須です。");

    const notice = {
      id: newId(),
      title,
      summary: String(payload?.summary || "").trim(),
      content: String(payload?.content || "").trim(),
      isImportant: payload?.isImportant === true,
      isActive: payload?.isActive !== false,
      publishedAt: payload?.isActive === false ? null : now,
      createdAt: now,
      updatedAt: now,
    };
    store.notices.push(notice);
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "notice.created",
      targetType: "notice",
      targetId: notice.id,
      summary: `Admin created notice ${notice.id}`,
      meta: { title: notice.title, isActive: notice.isActive },
    });
    await writeStore(store);
    return notice;
  });
}

export async function updateNoticeByAdmin(noticeId, patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const notice = store.notices.find((item) => item.id === noticeId);
    if (!notice) return null;
    const previousIsActive = Boolean(notice.isActive);

    if (patch?.title !== undefined) notice.title = String(patch.title || "").trim() || notice.title;
    if (patch?.summary !== undefined) notice.summary = String(patch.summary || "").trim();
    if (patch?.content !== undefined) notice.content = String(patch.content || "").trim();
    if (patch?.isImportant !== undefined) notice.isImportant = patch.isImportant === true;
    if (patch?.isActive !== undefined) notice.isActive = patch.isActive !== false;

    if (!previousIsActive && notice.isActive) {
      notice.publishedAt = nowIso();
    }
    if (!notice.isActive) {
      notice.publishedAt = null;
    }

    notice.updatedAt = nowIso();
    migrateNoticeShape(notice);
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "notice.updated",
      targetType: "notice",
      targetId: notice.id,
      summary: `Admin updated notice ${notice.id}`,
      meta: { title: notice.title, isActive: notice.isActive, isImportant: notice.isImportant },
    });
    await writeStore(store);
    return notice;
  });
}

export async function deleteNoticeByAdmin(noticeId, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const before = store.notices.length;
    const target = store.notices.find((item) => item.id === noticeId);
    store.notices = store.notices.filter((item) => item.id !== noticeId);
    if (store.notices.length === before) return false;
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "notice.deleted",
      targetType: "notice",
      targetId: noticeId,
      summary: `Admin deleted notice ${noticeId}`,
      meta: { title: target?.title || "" },
    });
    await writeStore(store);
    return true;
  });
}

export async function listReservationSlotsForStudent(userId, filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return [];
    const reservationSettings = store.systemSettings?.reservation || {};

    const fromDate = normalizeReservationDate(filters?.fromDate || makeIsoDate(0)) || makeIsoDate(0);
    const toDate =
      normalizeReservationDate(
        filters?.toDate || makeIsoDate(Math.max(1, Number(reservationSettings.maxBookableDays || RESERVATION_STUDENT_BOOKABLE_DAYS)))
      ) ||
      makeIsoDate(Math.max(1, Number(reservationSettings.maxBookableDays || RESERVATION_STUDENT_BOOKABLE_DAYS)));

    const slots = store.reservationSlots
      .filter((slot) => slot.date >= fromDate && slot.date <= toDate)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .map((slot) => {
        const activeCount = countActiveReservationsInSlot(store, slot.id);
        const availableCount = Math.max(0, Number(slot.capacity || 1) - activeCount);
        const slotStartMs = new Date(`${slot.date}T${slot.time}:00`).getTime();
        const isFuture = slotStartMs > Date.now();
        const isSameDay = slot.date === makeIsoDate(0);
        const sameDayAllowed = reservationSettings.allowSameDayBooking !== false;
        const studentConflict = validateStudentConflict(
          store,
          student.id,
          slot.date,
          slot.time,
          slot.durationMinutes
        );
        const operationBookable =
          slot.status === "open" && availableCount > 0 && isFuture && (sameDayAllowed || !isSameDay);
        const isBookable = operationBookable && studentConflict.ok;

        return {
          id: slot.id,
          date: slot.date,
          time: slot.time,
          durationMinutes: slot.durationMinutes,
          lessonMode: normalizeLessonMode(slot.lessonMode || "one_on_one"),
          capacity: slot.capacity,
          instructorUserId: normalizeInstructorUserId(slot.instructorUserId),
          instructorName: resolveInstructorName(store, slot.instructorUserId),
          status: slot.status,
          memo: slot.memo,
          activeReservationCount: activeCount,
          availableCount,
          isBookable,
          blockedReason: !operationBookable
            ? "operation_conflict"
            : studentConflict.ok
              ? null
              : "student_conflict",
        };
      });

    return slots;
  });
}

export async function listReservationSlotsForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const fromDate = normalizeReservationDate(filters?.fromDate || makeIsoDate(0)) || makeIsoDate(0);
    const toDate = normalizeReservationDate(filters?.toDate || makeIsoDate(21)) || makeIsoDate(21);
    const lessonMode = String(filters?.lessonMode || "").trim();

    const slots = store.reservationSlots
      .filter((slot) => {
        if (!(slot.date >= fromDate && slot.date <= toDate)) return false;
        if (!lessonMode) return true;
        return normalizeLessonMode(slot.lessonMode || "one_on_one") === normalizeLessonMode(lessonMode);
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .map((slot) => {
        const reservations = store.reservations.filter(
          (item) => item.slotId === slot.id && isActiveReservationStatus(item.status)
        );

        return {
          id: slot.id,
          date: slot.date,
          time: slot.time,
          durationMinutes: slot.durationMinutes,
          lessonMode: normalizeLessonMode(slot.lessonMode || "one_on_one"),
          capacity: slot.capacity,
          instructorUserId: normalizeInstructorUserId(slot.instructorUserId),
          instructorName: resolveInstructorName(store, slot.instructorUserId),
          status: slot.status,
          memo: slot.memo,
          activeReservationCount: reservations.length,
          reservationIds: reservations.map((item) => item.id),
        };
      });

    return slots;
  });
}

/**
 * 管理画面: スロット一覧に予約可否・不可理由（日本語）を付与
 */
export async function listReservationSlotsWithBookingEvalForAdmin(filters = {}, evalCtx = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const rows = await listReservationSlotsForAdmin(filters);
    const lessonRaw =
      evalCtx.lessonServiceId && findLessonServiceFromStore(store, String(evalCtx.lessonServiceId));
    return rows.map((row) => {
      const ev = evaluateAdminBookingSlot(store, { ...row }, {
        lessonService: lessonRaw || null,
        studentId: evalCtx.studentId,
        instructorFilterUserId: evalCtx.instructorUserId,
        lessonDeliveryType: evalCtx.lessonDeliveryType || "in_person",
      });
      return { ...row, bookingEval: ev };
    });
  });
}

/**
 * 予約候補（スロット実体ベース + 理由コード）— 管理画面・学生 API 共用
 * targetDate または date があれば 1 日分。fromDate〜toDate なら最大 21 日まで連結。
 */
export async function getReservationCandidatesForBooking(payload = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const targetDate = String(payload.targetDate || payload.date || "").slice(0, 10);
    const fromDate = String(payload.fromDate || "").slice(0, 10);
    const toDate = String(payload.toDate || "").slice(0, 10);

    let dates = [];
    if (targetDate) {
      dates = [targetDate];
    } else if (fromDate) {
      const end = toDate || fromDate;
      let cur = fromDate;
      for (let i = 0; i < 21; i++) {
        dates.push(cur);
        if (cur >= end) break;
        cur = addDaysYmd(cur, 1);
      }
    } else {
      return {
        ok: false,
        candidates: [],
        blockedReasons: [
          { code: ReasonCodes.UNKNOWN, messageJa: "日付（targetDate または fromDate）が必要です。" },
        ],
        lessonType: null,
        daySummary: null,
        daySummaries: [],
      };
    }

    if (dates.length === 1) {
      return buildReservationCandidates(store, { ...payload, targetDate: dates[0] });
    }

    const merged = {
      ok: true,
      lessonType: null,
      daySummary: null,
      daySummaries: [],
      candidates: [],
      blockedReasons: [],
      studentSnapshot: null,
    };

    for (const d of dates) {
      const chunk = buildReservationCandidates(store, { ...payload, targetDate: d });
      if (!merged.lessonType && chunk.lessonType) merged.lessonType = chunk.lessonType;
      if (!merged.studentSnapshot && chunk.studentSnapshot) merged.studentSnapshot = chunk.studentSnapshot;
      merged.daySummaries.push({ targetDate: d, daySummary: chunk.daySummary });
      merged.candidates.push(...(chunk.candidates || []));
      merged.blockedReasons.push(...(chunk.blockedReasons || []));
      if (chunk.ok === false) merged.ok = false;
    }
    return merged;
  });
}

/** 管理画面の学生オートコンプリート用（軽量 DTO） */
export async function searchStudentsForBookingAdmin(q = "", options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const query = String(q || "").trim().toLowerCase();
    const limit = Math.min(80, Math.max(1, Number(options.limit || 50)));
    const rows = store.students.map((student) => {
      migrateStudentShape(student);
      applyLessonMinutesFromJournal(store, student);
      const link = store.userStudentLinks.find((item) => item.studentId === student.id);
      const user = link ? store.users.find((item) => item.id === link.userId) : null;
      return toStudentDto(student, user, resolvePairInfoForStudent(store, student.id));
    });
    const filtered = query
      ? rows.filter((s) => {
          const hay = [s.studentNumber, s.nameKanji, s.nameFurigana, s.email, s.phone, s.crmProfile?.phoneMobile]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (hay.includes(query)) return true;
          const qd = query.replace(/\D/g, "");
          const pd = String(s.phone || "").replace(/\D/g, "");
          return qd.length >= 3 && pd.includes(qd);
        })
      : rows.slice(0, limit);
    return filtered.slice(0, limit).map((s) => {
      const remainingMinutes = Number(s.lessonMinutes?.remainingMinutes ?? 0);
      return {
        id: s.id,
        name: s.nameKanji,
        nameKanji: s.nameKanji,
        furigana: s.nameFurigana,
        nameFurigana: s.nameFurigana,
        studentNumber: s.studentNumber,
        phone: s.phone,
        remainingMinutes,
        lessonMinutes: { remainingMinutes },
        currentPoints: Number(s.points?.balance ?? 0),
      };
    });
  });
}

/** GET /api/admin/lesson-types 用 */
export async function listLessonTypesForStudent() {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const services = Array.isArray(store.systemSettings?.lessonServiceCatalog?.services)
      ? store.systemSettings.lessonServiceCatalog.services
      : [];
    const out = [];
    for (const raw of services) {
      const n = normalizeLessonServiceCatalogEntry(raw);
      if (!n.enabled || n.adminOnlyBooking || !n.studentSelectable) continue;
      out.push({
        id: n.id,
        displayName: n.displayNameJa,
        durationMinutes: n.durationMinutes,
        pointCost: n.consumePoints,
        lessonMode: n.lessonFormat,
        teacherUserIds: n.teacherUserIds || [],
        sortOrder: n.sortOrder,
      });
    }
    return out.sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
  });
}

export async function listLessonTypesForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const services = Array.isArray(store.systemSettings?.lessonServiceCatalog?.services)
      ? store.systemSettings.lessonServiceCatalog.services
      : [];
    const users = store.users || [];
    const out = [];
    for (const raw of services) {
      const n = normalizeLessonServiceCatalogEntry(raw);
      const names = (n.teacherUserIds || [])
        .slice(0, 8)
        .map((tid) => {
          const u = users.find((x) => String(x.id) === String(tid));
          return u?.displayName || u?.email || String(tid);
        })
        .filter(Boolean);
      const allowedTeachersSummary = names.length
        ? names.join("、")
        : n.teacherUserIds?.length
          ? ""
          : "指定なし（全講師可）";
      out.push({
        id: n.id,
        displayName: n.displayNameJa,
        durationMinutes: n.durationMinutes,
        pointCost: n.consumePoints,
        lessonMode: n.lessonFormat,
        active: n.enabled !== false,
        allowedTeachersSummary: allowedTeachersSummary || "—",
        teacherUserIds: n.teacherUserIds || [],
        sortOrder: n.sortOrder,
      });
    }
    return out.sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
  });
}

export async function updateReservationSlotByAdmin(slotId, patch, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const slot = findSlotById(store, slotId);
    if (!slot) return null;

    const previousSlotStatus = String(slot.status || "open");
    const previousLessonMode = normalizeLessonMode(slot.lessonMode || "one_on_one");
    const previousCapacity = Number(slot.capacity || defaultCapacityForLessonMode(previousLessonMode));
    const previousInstructorUserId = normalizeInstructorUserId(slot.instructorUserId);

    if (patch?.lessonMode !== undefined) {
      const nextLessonMode = normalizeLessonMode(patch.lessonMode);
      slot.lessonMode = nextLessonMode;

      // Suggest default capacity when lesson mode changes unless explicit capacity is provided.
      if (patch?.capacity === undefined && nextLessonMode !== previousLessonMode) {
        slot.capacity = defaultCapacityForLessonMode(nextLessonMode);
      }
    }

    if (patch?.capacity !== undefined) {
      slot.capacity = Math.max(1, Number(patch.capacity || slot.capacity || 1));
    }
    if (patch?.status !== undefined) {
      slot.status = String(patch.status || slot.status) === "closed" ? "closed" : "open";
    }
    if (patch?.memo !== undefined) {
      slot.memo = String(patch.memo || "").trim();
    }
    if (patch?.instructorUserId !== undefined) {
      slot.instructorUserId = normalizeInstructorUserId(patch.instructorUserId);
    }

    slot.updatedAt = nowIso();

    // Slot-assigned instructor becomes reservation-assigned instructor for active reservations.
    store.reservations.forEach((reservation) => {
      if (reservation.slotId !== slot.id) return;
      if (!["requested", "confirmed"].includes(reservation.status)) return;
      reservation.instructorUserId = normalizeInstructorUserId(slot.instructorUserId);
      reservation.instructorName = resolveInstructorName(store, slot.instructorUserId);
      reservation.updatedAt = slot.updatedAt;
    });

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.slot_updated",
      targetType: "reservation_slot",
      targetId: slot.id,
      summary: `Admin updated reservation slot ${slot.id}`,
      meta: {
        previousLessonMode,
        previousCapacity,
        previousInstructorUserId,
        lessonMode: slot.lessonMode,
        capacity: slot.capacity,
        instructorUserId: slot.instructorUserId,
        previousSlotStatus,
        nextSlotStatus: slot.status,
      },
    });

    if (patch?.status !== undefined && previousSlotStatus !== String(slot.status || "")) {
      const opened = slot.status === "open";
      writeAuditLog(store, {
        actorUserId: actor?.userId || null,
        actorRole: actor?.role || "admin",
        action: opened ? "reservation.slot_opened" : "reservation.slot_closed",
        targetType: "reservation_slot",
        targetId: slot.id,
        summary: opened ? `Slot opened ${slot.id}` : `Slot closed ${slot.id}`,
        meta: {
          date: slot.date,
          time: slot.time,
          previousStatus: previousSlotStatus,
          nextStatus: slot.status,
        },
      });
    }

    await writeStore(store);
    return {
      id: slot.id,
      date: slot.date,
      time: slot.time,
      durationMinutes: slot.durationMinutes,
      lessonMode: slot.lessonMode,
      capacity: slot.capacity,
      instructorUserId: normalizeInstructorUserId(slot.instructorUserId),
      instructorName: resolveInstructorName(store, slot.instructorUserId),
      status: slot.status,
      memo: slot.memo,
    };
  });
}

export async function createReservationSlotByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const date = normalizeReservationDate(payload?.date || "");
    const time = normalizeClockTime(payload?.time || "");
    const durationMinutes = Math.max(30, Number(payload?.durationMinutes || 60));
    if (!date || !time) {
      throw new Error("日付と時間は必須です。");
    }
    const exists = store.reservationSlots.find(
      (slot) =>
        slot.date === date &&
        slot.time === time &&
        Number(slot.durationMinutes || 0) === Number(durationMinutes)
    );
    if (exists) {
      throw new Error("同じ時間のスロットが既に存在します。");
    }

    const lessonMode = normalizeLessonMode(payload?.lessonMode || "one_on_one");
    const slot = {
      id: newId(),
      date,
      time,
      durationMinutes,
      lessonMode,
      capacity: Math.max(1, Number(payload?.capacity || defaultCapacityForLessonMode(lessonMode))),
      instructorUserId: normalizeInstructorUserId(payload?.instructorUserId),
      status: String(payload?.status || "open") === "closed" ? "closed" : "open",
      memo: String(payload?.memo || "").trim(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.reservationSlots.push(slot);
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.slot_created",
      targetType: "reservation_slot",
      targetId: slot.id,
      summary: `Admin created reservation slot ${slot.id}`,
      meta: { date: slot.date, time: slot.time, durationMinutes: slot.durationMinutes },
    });
    await writeStore(store);
    return {
      id: slot.id,
      date: slot.date,
      time: slot.time,
      durationMinutes: slot.durationMinutes,
      lessonMode: slot.lessonMode,
      capacity: slot.capacity,
      instructorUserId: slot.instructorUserId,
      instructorName: resolveInstructorName(store, slot.instructorUserId),
      status: slot.status,
      memo: slot.memo,
    };
  });
}

export async function regenerateReservationSlotsByAdmin(actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureReservationPolicy(store);
    const mode = normalizeTimeGenerationMode(store.reservationPolicy.timeGenerationMode);
    const horizonDays = Math.max(7, Math.min(90, Number(process.env.RESERVATION_SLOT_GENERATE_DAYS || 28)));
    const pinnedSlotIds = new Set(store.reservations.map((reservation) => reservation.slotId).filter(Boolean));
    const pinnedSlots = store.reservationSlots.filter((slot) => pinnedSlotIds.has(slot.id));
    const generated = [];

    if (mode !== "direct_input") {
      for (let offset = 0; offset < horizonDays; offset += 1) {
        const date = makeIsoDate(offset);
        generated.push(...buildGeneratedSlots(store, date, mode));
      }
    }

    const merged = [];
    const seen = new Set();
    [...pinnedSlots, ...generated].forEach((slot) => {
      const key = `${slot.date}|${slot.time}|${slot.durationMinutes}|${slot.lessonMode}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(slot);
    });
    store.reservationSlots = merged;
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.slots_regenerated",
      targetType: "reservation_slot",
      targetId: null,
      summary: "Admin regenerated reservation slots",
      meta: { mode, generatedCount: generated.length, keptCount: pinnedSlots.length, total: merged.length },
    });
    await writeStore(store);
    return { mode, total: merged.length };
  });
}

export async function createReservationByStudent(userId, payload) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    migrateStudentShape(student);

    const normalized = normalizeReservationPayload(payload);
    const lessonServiceId = normalized.lessonServiceId || "";
    const lessonRow = lessonServiceId ? findLessonServiceFromStore(store, lessonServiceId) : null;
    const lessonSvc = lessonRow ? normalizeLessonServiceCatalogEntry(lessonRow) : null;
    if (lessonSvc) {
      if (lessonSvc.enabled === false) {
        throw new Error("このレッスンは現在利用できません。");
      }
      if (lessonSvc.adminOnlyBooking === true) {
        throw new Error("このレッスンは管理者のみ予約できます。");
      }
      if (lessonSvc.studentSelectable === false) {
        throw new Error("このレッスンは学生から予約できません。");
      }
    }

    const slot =
      findSlotById(store, normalized.slotId) ||
      findSlotByDateTime(store, normalized.date, normalized.time, normalized.durationMinutes);
    if (!slot) {
      throw new Error("예약 가능한 슬롯을 찾을 수 없습니다.");
    }
    if (lessonSvc && Number(lessonSvc.durationMinutes) !== Number(slot.durationMinutes)) {
      throw new Error("選択したレッスンと枠の長さが一致しません。");
    }

    const studentConflict = validateStudentConflict(
      store,
      student.id,
      slot.date,
      slot.time,
      slot.durationMinutes
    );
    if (!studentConflict.ok) {
      throw new Error("같은 시간대에 이미 학생 예약이 존재합니다.");
    }

    const operationConflict = validateOperationConflict(store, slot);
    if (!operationConflict.ok) {
      if (operationConflict.reason === "slot_closed") {
        throw new Error("현재 선택한 슬롯은 예약할 수 없습니다.");
      }
      if (operationConflict.reason === "slot_started") {
        throw new Error("수업 시작 시간이 지난 슬롯은 예약할 수 없습니다.");
      }
      throw new Error("해당 시간대는 이미 예약이 마감되었습니다.");
    }

    const activePair = findActivePairByStudentId(store, student.id);
    const pointCost = resolveReservationPointCost(store, {
      lessonServiceId: lessonServiceId || null,
      durationMinutes: slot.durationMinutes,
    });

    const reservation = {
      id: newId(),
      studentId: student.id,
      slotId: slot.id,
      date: slot.date,
      time: slot.time,
      durationMinutes: slot.durationMinutes,
      slotStatus: slot.status,
      slotLessonMode: normalizeLessonMode(slot.lessonMode || "one_on_one"),
      instructorUserId: normalizeInstructorUserId(slot.instructorUserId),
      instructorName: resolveInstructorName(store, slot.instructorUserId),
      status: "requested",
      lessonDeliveryType: normalized.lessonDeliveryType,
      memo: normalized.memo,
      lessonServiceId: lessonServiceId || null,
      lessonServiceNameJa: lessonSvc ? lessonSvc.displayNameJa : null,
      expectedPointsConsume: pointCost,
      pointsCharged: null,
      createdByRole: "student",
      createdByUserId: userId,
      cancelledAt: null,
      cancelledByRole: null,
      cancelledByUserId: null,
      attendanceStatus: "scheduled",
      attendanceMarkedAt: null,
      attendanceMarkedByRole: null,
      attendanceMarkedByUserId: null,
      lessonMinutesDeducted: 0,
      lessonMinutesDeductedAt: null,
      lessonMinutesDeductedByRole: null,
      lessonMinutesDeductedByUserId: null,
      lessonUnitId: null,
      pairLinkId: activePair?.id || null,
      lessonGroupType: normalizeLessonGroupType(null, slot.lessonMode || "one_on_one"),
      history: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    reservation.lessonUnitId = reservation.id;
    applyReservationPointCharge(store, student, reservation, pointCost, "student", {
      userId,
      role: "student",
    });
    appendReservationHistory(reservation, {
      action: "created",
      actorRole: "student",
      actorUserId: userId,
      summary: "학생이 예약을 생성했습니다.",
      meta: {
        studentId: student.id,
        slotId: slot.id,
        status: reservation.status,
      },
    });
    store.reservations.push(reservation);

    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "reservation.student_created",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `Student created reservation ${reservation.id}`,
      meta: {
        studentId: student.id,
        status: reservation.status,
        date: reservation.date,
        time: reservation.time,
        slotId: slot.id,
        durationMinutes: reservation.durationMinutes,
        lessonDeliveryType: reservation.lessonDeliveryType,
      },
    });
    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "reservation.created",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `予約作成 (学生) ${reservation.date} ${reservation.time}`,
      meta: {
        studentId: student.id,
        slotId: slot.id,
        date: reservation.date,
        time: reservation.time,
        durationMinutes: reservation.durationMinutes,
        lessonDeliveryType: reservation.lessonDeliveryType,
        source: "student",
      },
    });

    await writeStore(store);
    return toReservationDto(reservation, student);
  });
}

export async function listReservationsForStudent(userId, filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) {
      return {
        items: [],
        pagination: paginate([], 1, 10).pagination,
        lessonMinutes: null,
      };
    }
    migrateStudentShape(student);

    const linkedUser = store.users.find((u) => u.id === userId) || null;
    const rows = store.reservations
      .filter((item) => item.studentId === student.id)
      .map((item) => toReservationDto(item, student, linkedUser))
      .sort(reservationSortDesc);

    const filtered = filterReservations(rows, filters);
    const paged = paginate(filtered, filters.page, filters.pageSize);
    return {
      ...paged,
      lessonMinutes: student.lessonMinutes,
    };
  });
}

export async function rescheduleReservationByStudent(userId, reservationId, payload) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return null;

    const reservation = store.reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.studentId !== student.id) return null;

    const policy = buildStudentSelfServicePolicy(reservation, store.systemSettings?.reservation || {});
    if (!policy.canStudentChange) {
      throw new Error("변경 가능 시간이 지나 학생이 직접 변경할 수 없습니다.");
    }

    const targetSlotId = String(payload?.slotId || "").trim();
    const targetSlot = findSlotById(store, targetSlotId);
    if (!targetSlot) {
      throw new Error("변경할 슬롯을 찾을 수 없습니다.");
    }
    if (targetSlot.id === reservation.slotId) {
      throw new Error("현재와 동일한 슬롯입니다.");
    }

    const studentConflict = validateStudentConflict(
      store,
      student.id,
      targetSlot.date,
      targetSlot.time,
      targetSlot.durationMinutes,
      reservation.id
    );
    if (!studentConflict.ok) {
      throw new Error("학생 기준 충돌로 인해 변경할 수 없습니다.");
    }

    const operationConflict = validateOperationConflict(store, targetSlot, reservation.id);
    if (!operationConflict.ok) {
      if (operationConflict.reason === "slot_closed") {
        throw new Error("해당 슬롯은 닫혀 있어 변경할 수 없습니다.");
      }
      if (operationConflict.reason === "slot_started") {
        throw new Error("이미 시작된 시간대로는 변경할 수 없습니다.");
      }
      throw new Error("운영 기준 충돌로 인해 변경할 수 없습니다.");
    }

    const fromSlotId = reservation.slotId;
    const fromDate = reservation.date;
    const fromTime = reservation.time;
    const fromDuration = reservation.durationMinutes;
    reservation.slotId = targetSlot.id;
    reservation.date = targetSlot.date;
    reservation.time = targetSlot.time;
    reservation.durationMinutes = targetSlot.durationMinutes;
    reservation.slotStatus = targetSlot.status;
    reservation.slotLessonMode = normalizeLessonMode(targetSlot.lessonMode || "one_on_one");
    reservation.instructorUserId = normalizeInstructorUserId(targetSlot.instructorUserId);
    reservation.instructorName = resolveInstructorName(store, targetSlot.instructorUserId);
    reservation.updatedAt = nowIso();

    const newCost = resolveReservationPointCost(store, {
      lessonServiceId: reservation.lessonServiceId,
      durationMinutes: targetSlot.durationMinutes,
    });
    applyReservationPointRescheduleDelta(
      store,
      student,
      reservation,
      newCost,
      { userId, role: "student" },
      "student"
    );

    appendReservationHistory(reservation, {
      action: "student_rescheduled",
      actorRole: "student",
      actorUserId: userId,
      summary: "학생이 예약 시간을 변경했습니다.",
      meta: {
        studentId: student.id,
        fromSlotId,
        toSlotId: targetSlot.id,
      },
    });

    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "reservation.student_rescheduled",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `Student rescheduled reservation ${reservation.id}`,
      meta: {
        studentId: student.id,
        fromSlotId,
        toSlotId: targetSlot.id,
        fromDate,
        fromTime,
        toDate: targetSlot.date,
        toTime: targetSlot.time,
        fromDuration,
        toDuration: targetSlot.durationMinutes,
      },
    });
    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "reservation.updated",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `予約変更 (学生) ${fromDate} ${fromTime} → ${targetSlot.date} ${targetSlot.time}`,
      meta: {
        studentId: student.id,
        phase: "student_reschedule",
        fromSlotId,
        toSlotId: targetSlot.id,
        fromDate,
        fromTime,
        toDate: targetSlot.date,
        toTime: targetSlot.time,
        source: "student",
      },
    });

    await writeStore(store);
    return toReservationDto(reservation, student);
  });
}

export async function cancelReservationByStudent(userId, reservationId) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return null;

    const reservation = store.reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.studentId !== student.id) return null;
    const policy = buildStudentSelfServicePolicy(reservation, store.systemSettings?.reservation || {});
    if (!policy.canStudentCancel) {
      throw new Error("취소 가능 시간이 지나 학생이 직접 취소할 수 없습니다.");
    }

    const cancelSnapshot = {
      date: reservation.date,
      time: reservation.time,
      slotId: reservation.slotId,
      status: reservation.status,
    };

    reservation.status = "cancelled";
    reservation.cancelledAt = nowIso();
    reservation.cancelledByRole = "student";
    reservation.cancelledByUserId = userId;
    if (LESSON_MINUTES_REFUND_ON_STUDENT_CANCEL) {
      applyLessonMinuteRefundForCancellation(
        store,
        reservation,
        { userId, role: "student" },
        "student"
      );
    }
    applyReservationPointRefundOnCancel(store, student, reservation, "student", {
      userId,
      role: "student",
    });
    reservation.updatedAt = nowIso();
    appendReservationHistory(reservation, {
      action: "student_cancelled",
      actorRole: "student",
      actorUserId: userId,
      summary: "학생이 예약을 취소했습니다.",
      meta: { studentId: student.id },
    });

    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "reservation.student_cancelled",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `Student cancelled reservation ${reservation.id}`,
      meta: {
        studentId: student.id,
        status: reservation.status,
        previousStatus: cancelSnapshot.status,
        date: cancelSnapshot.date,
        time: cancelSnapshot.time,
        slotId: cancelSnapshot.slotId,
      },
    });
    writeAuditLog(store, {
      actorUserId: userId,
      actorRole: "student",
      action: "reservation.cancelled",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `予約キャンセル (学生) ${cancelSnapshot.date} ${cancelSnapshot.time}`,
      meta: {
        studentId: student.id,
        previousStatus: cancelSnapshot.status,
        date: cancelSnapshot.date,
        time: cancelSnapshot.time,
        slotId: cancelSnapshot.slotId,
        source: "student",
      },
    });

    await writeStore(store);
    return toReservationDto(reservation, student);
  });
}

export async function createReservationByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const slotId = String(payload?.slotId || "").trim();
    const studentId = String(payload?.studentId || "").trim();
    const lessonDeliveryType = normalizeLessonDeliveryType(payload?.lessonDeliveryType);
    const memo = String(payload?.memo || "").trim();
    const lessonServiceId = String(payload?.lessonServiceId || "").trim();
    const lessonRow = lessonServiceId ? findLessonServiceFromStore(store, lessonServiceId) : null;
    const lessonSvc = lessonRow ? normalizeLessonServiceCatalogEntry(lessonRow) : null;

    if (!slotId || !studentId) {
      throw new Error("スロットと学生を選択してください。");
    }
    const slot = findSlotById(store, slotId);
    if (!slot) throw new Error("対象スロットが見つかりません。");
    const student = store.students.find((item) => item.id === studentId) || null;
    if (!student) throw new Error("学生情報を確認してください。");
    migrateStudentShape(student);

    if (lessonSvc) {
      if (Number(slot.durationMinutes || 0) !== Number(lessonSvc.durationMinutes)) {
        throw new Error("スロットの長さが選択したレッスンと一致しません。");
      }
    }

    const studentConflict = validateStudentConflict(
      store,
      student.id,
      slot.date,
      slot.time,
      slot.durationMinutes
    );
    if (!studentConflict.ok) {
      throw new Error(`${student.nameKanji || student.email} は同時間帯に既存予約があります。`);
    }

    const operationConflict = validateOperationConflict(store, slot);
    if (!operationConflict.ok) {
      if (operationConflict.reason === "slot_closed") {
        throw new Error("現在選択したスロットは予約できません。");
      }
      if (operationConflict.reason === "slot_started") {
        throw new Error("開始済みスロットには予約できません。");
      }
      throw new Error("スロット残席不足により予約を作成できません。");
    }

    const activePair = findActivePairByStudentId(store, student.id);
    const ts = nowIso();
    const pointCost = resolveReservationPointCost(store, {
      lessonServiceId: lessonServiceId || null,
      durationMinutes: slot.durationMinutes,
    });
    const reservation = {
      id: newId(),
      studentId: student.id,
      slotId: slot.id,
      date: slot.date,
      time: slot.time,
      durationMinutes: slot.durationMinutes,
      slotStatus: slot.status,
      slotLessonMode: normalizeLessonMode(slot.lessonMode || "one_on_one"),
      lessonGroupType: normalizeLessonGroupType(null, slot.lessonMode || "one_on_one"),
      lessonUnitId: null,
      pairLinkId: activePair?.id || null,
      instructorUserId: normalizeInstructorUserId(slot.instructorUserId),
      instructorName: resolveInstructorName(store, slot.instructorUserId),
      status: "requested",
      lessonDeliveryType,
      memo,
      lessonServiceId: lessonServiceId || null,
      lessonServiceNameJa: lessonSvc ? lessonSvc.displayNameJa : null,
      expectedPointsConsume: pointCost,
      pointsCharged: null,
      createdByRole: actor?.role || "admin",
      createdByUserId: actor?.userId || null,
      cancelledAt: null,
      cancelledByRole: null,
      cancelledByUserId: null,
      attendanceStatus: "scheduled",
      attendanceMarkedAt: null,
      attendanceMarkedByRole: null,
      attendanceMarkedByUserId: null,
      lessonMinutesDeducted: 0,
      lessonMinutesDeductedAt: null,
      lessonMinutesDeductedByRole: null,
      lessonMinutesDeductedByUserId: null,
      history: [],
      createdAt: ts,
      updatedAt: ts,
    };
    reservation.lessonUnitId = reservation.id;
    applyReservationPointCharge(store, student, reservation, pointCost, "admin", {
      userId: actor?.userId || null,
      role: actor?.role || "admin",
    });
    appendReservationHistory(reservation, {
      action: "admin_created",
      actorRole: actor?.role || "admin",
      actorUserId: actor?.userId || null,
      summary: "管理者が予約を作成しました。",
      meta: { studentId: student.id, slotId: slot.id, status: reservation.status },
    });
    store.reservations.push(reservation);
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.admin_created",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `Admin created reservation ${reservation.id}`,
      meta: {
        studentId: student.id,
        slotId: slot.id,
        status: reservation.status,
        date: reservation.date,
        time: reservation.time,
        durationMinutes: reservation.durationMinutes,
        lessonDeliveryType: reservation.lessonDeliveryType,
      },
    });
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.created",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `予約作成 (管理者) ${reservation.date} ${reservation.time}`,
      meta: {
        studentId: student.id,
        slotId: slot.id,
        date: reservation.date,
        time: reservation.time,
        durationMinutes: reservation.durationMinutes,
        lessonDeliveryType: reservation.lessonDeliveryType,
        source: "admin",
      },
    });
    await writeStore(store);
    return toReservationDto(reservation, student);
  });
}

export async function createPairReservationByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    if (getPairPolicySettings(store).pairLessonEnabled === false) {
      throw new Error("ペア予約機能が無効化されています。");
    }
    const slotId = String(payload?.slotId || "").trim();
    const studentAId = String(payload?.studentAId || "").trim();
    const studentBId = String(payload?.studentBId || "").trim();
    const lessonDeliveryType = normalizeLessonDeliveryType(payload?.lessonDeliveryType);
    const memo = String(payload?.memo || "").trim();
    const lessonServiceId = String(payload?.lessonServiceId || "").trim();

    if (!slotId || !studentAId || !studentBId) {
      throw new Error("スロットと2名の学生を選択してください。");
    }
    if (studentAId === studentBId) {
      throw new Error("同じ学生を2回選択できません。");
    }

    const slot = findSlotById(store, slotId);
    if (!slot) throw new Error("対象スロットが見つかりません。");
    const lessonRow = lessonServiceId ? findLessonServiceFromStore(store, lessonServiceId) : null;
    const lessonSvc = lessonRow ? normalizeLessonServiceCatalogEntry(lessonRow) : null;
    const pointCost = resolveReservationPointCost(store, {
      lessonServiceId: lessonServiceId || null,
      durationMinutes: slot.durationMinutes,
    });
    if (normalizeLessonMode(slot.lessonMode || "one_on_one") !== "group") {
      throw new Error("ペア予約は group スロットでのみ作成できます。");
    }
    if (Number(slot.capacity || 1) < 2) {
      throw new Error("ペア予約には capacity が2以上必要です。");
    }

    const studentA = store.students.find((item) => item.id === studentAId);
    const studentB = store.students.find((item) => item.id === studentBId);
    if (!studentA || !studentB) {
      throw new Error("学生情報を確認してください。");
    }
    migrateStudentShape(studentA);
    migrateStudentShape(studentB);

    const pair = findActivePairBetweenStudents(store, studentAId, studentBId);
    if (!pair) {
      throw new Error("選択した2名は有効なペアとして登録されていません。");
    }

    const pairSlotConflictA = validateStudentConflict(
      store,
      studentA.id,
      slot.date,
      slot.time,
      slot.durationMinutes
    );
    if (!pairSlotConflictA.ok) {
      throw new Error(`${studentA.nameKanji || studentA.email} は同時間帯に既存予約があります。`);
    }
    const pairSlotConflictB = validateStudentConflict(
      store,
      studentB.id,
      slot.date,
      slot.time,
      slot.durationMinutes
    );
    if (!pairSlotConflictB.ok) {
      throw new Error(`${studentB.nameKanji || studentB.email} は同時間帯に既存予約があります。`);
    }

    const opConflict = validateOperationConflict(store, slot);
    if (!opConflict.ok) {
      throw new Error("スロット運用条件によりペア予約を作成できません。");
    }
    const activeCount = countActiveReservationsInSlot(store, slot.id);
    if (activeCount + 2 > Number(slot.capacity || 1)) {
      throw new Error("スロット残席不足のためペア予約を作成できません。");
    }
    if (lessonSvc && Number(lessonSvc.durationMinutes) !== Number(slot.durationMinutes)) {
      throw new Error("スロットの長さが選択したレッスンと一致しません。");
    }

    const ts = nowIso();
    const lessonUnitId = newId();
    const students = [studentA, studentB];
    const createdReservations = [];

    for (const student of students) {
      const reservation = {
        id: newId(),
        studentId: student.id,
        slotId: slot.id,
        date: slot.date,
        time: slot.time,
        durationMinutes: slot.durationMinutes,
        slotStatus: slot.status,
        slotLessonMode: normalizeLessonMode(slot.lessonMode || "group"),
        lessonGroupType: "pair",
        lessonUnitId,
        pairLinkId: pair.id,
        instructorUserId: normalizeInstructorUserId(slot.instructorUserId),
        instructorName: resolveInstructorName(store, slot.instructorUserId),
        status: "requested",
        lessonDeliveryType,
        memo,
        lessonServiceId: lessonServiceId || null,
        lessonServiceNameJa: lessonSvc ? lessonSvc.displayNameJa : null,
        expectedPointsConsume: pointCost,
        pointsCharged: null,
        createdByRole: actor?.role || "admin",
        createdByUserId: actor?.userId || null,
        cancelledAt: null,
        cancelledByRole: null,
        cancelledByUserId: null,
        attendanceStatus: "scheduled",
        attendanceMarkedAt: null,
        attendanceMarkedByRole: null,
        attendanceMarkedByUserId: null,
        lessonMinutesDeducted: 0,
        lessonMinutesDeductedAt: null,
        lessonMinutesDeductedByRole: null,
        lessonMinutesDeductedByUserId: null,
        history: [],
        createdAt: ts,
        updatedAt: ts,
      };
      applyReservationPointCharge(store, student, reservation, pointCost, "admin", {
        userId: actor?.userId || null,
        role: actor?.role || "admin",
      });
      appendReservationHistory(reservation, {
        action: "admin_pair_created",
        actorRole: actor?.role || "admin",
        actorUserId: actor?.userId || null,
        summary: "管理者がペアレッスン予約を作成しました。",
        meta: { studentId: student.id, lessonUnitId, pairLinkId: pair.id, slotId: slot.id },
      });
      store.reservations.push(reservation);
      createdReservations.push(toReservationDto(reservation, student));
    }

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.admin_pair_created",
      targetType: "reservation",
      targetId: lessonUnitId,
      summary: `Admin created pair lesson unit ${lessonUnitId}`,
      meta: {
        lessonUnitId,
        slotId: slot.id,
        pairLinkId: pair.id,
        studentIds: [studentA.id, studentB.id],
      },
    });

    await writeStore(store);
    return {
      lessonUnitId,
      pairLinkId: pair.id,
      reservations: createdReservations,
    };
  });
}

export async function listParentChildrenForUser(parentUserId) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    if (store.systemSettings?.parent?.parentAccountEnabled === false) return [];
    const parentPolicy = getParentPolicySettings(store);
    const links = listActiveParentLinksByUser(store, parentUserId);
    const rows = links
      .map((link) => {
        const student = store.students.find((item) => item.id === link.studentId) || null;
        if (!student) return null;
        migrateStudentShape(student);
        const nextReservation =
          store.reservations
            .filter(
              (item) =>
                item.studentId === student.id &&
                ["requested", "confirmed"].includes(String(item.status || ""))
            )
            .map((item) => toReservationDto(item, student))
            .sort(nextReservationSortAsc)[0] || null;
        return {
          studentId: student.id,
          studentNumber: student.studentNumber || null,
          nameKanji: student.nameKanji || "",
          nameFurigana: student.nameFurigana || "",
          relationship: link.relationship,
          isPrimary: Boolean(link.isPrimary),
          permissions: {
            canViewReservations: Boolean(link.canViewReservations) && parentPolicy.canViewReservations !== false,
            canViewLessonNotes: Boolean(link.canViewLessonNotes) && parentPolicy.canViewLessonNotes !== false,
            canViewHomework: Boolean(link.canViewHomework) && parentPolicy.canViewHomework !== false,
            canViewPayments: Boolean(link.canViewPayments),
            canReceiveNotifications: Boolean(link.canReceiveNotifications),
          },
          nextReservation,
        };
      })
      .filter(Boolean)
      .sort((a, b) => String(a.nameKanji || "").localeCompare(String(b.nameKanji || "")));
    return rows;
  });
}

export async function getParentChildOverviewForUser(parentUserId, studentId) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    if (store.systemSettings?.parent?.parentAccountEnabled === false) return null;
    const parentPolicy = getParentPolicySettings(store);
    const activeLink = listActiveParentLinksByUser(store, parentUserId).find(
      (link) => link.studentId === studentId
    );
    if (!activeLink) return null;

    const student = store.students.find((item) => item.id === studentId);
    if (!student) return null;
    migrateStudentShape(student);

    const reservations = Boolean(activeLink.canViewReservations) && parentPolicy.canViewReservations !== false
      ? store.reservations
          .filter((item) => item.studentId === studentId)
          .map((item) => toReservationDto(item, student))
          .sort(reservationSortDesc)
          .slice(0, 20)
      : [];

    const notices = store.notices
      .filter((notice) => notice.isActive !== false)
      .sort((a, b) => String(b.publishedAt || b.updatedAt || "").localeCompare(String(a.publishedAt || a.updatedAt || "")))
      .slice(0, 5)
      .map((notice) => ({
        id: notice.id,
        title: notice.title || "",
        summary: notice.summary || "",
        isImportant: Boolean(notice.isImportant),
        publishedAt: notice.publishedAt || notice.updatedAt || null,
      }));

    return {
      student: {
        id: student.id,
        studentNumber: student.studentNumber || null,
        nameKanji: student.nameKanji || "",
        nameFurigana: student.nameFurigana || "",
        registrationStatus: student.registrationStatus,
        consentStatus: student.consentStatus,
        lessonMinutes: student.lessonMinutes,
        points: student.points,
      },
      link: {
        relationship: activeLink.relationship,
        isPrimary: Boolean(activeLink.isPrimary),
        permissions: {
          canViewReservations:
            Boolean(activeLink.canViewReservations) && parentPolicy.canViewReservations !== false,
          canViewLessonNotes:
            Boolean(activeLink.canViewLessonNotes) && parentPolicy.canViewLessonNotes !== false,
          canViewHomework: Boolean(activeLink.canViewHomework) && parentPolicy.canViewHomework !== false,
          canViewPayments: Boolean(activeLink.canViewPayments),
          canReceiveNotifications: Boolean(activeLink.canReceiveNotifications),
        },
      },
      reservations,
      notices,
      lessonMinuteLogs: store.lessonMinuteLogs
        .filter((log) => log.studentId === student.id)
        .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
        .slice(0, 20),
    };
  });
}

export async function listLessonNotesForStudent(userId) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return [];
    return collectLessonNotesByStudent(store, student.id, { includePrivate: false })
      .sort((a, b) => String(b.date || b.updatedAt || "").localeCompare(String(a.date || a.updatedAt || "")));
  });
}

export async function listLessonNotesForParentChild(parentUserId, studentId) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const parentPolicy = getParentPolicySettings(store);
    if (parentPolicy.parentAccountEnabled === false) {
      return { canView: false, items: [] };
    }
    const activeLink = listActiveParentLinksByUser(store, parentUserId).find(
      (link) => link.studentId === studentId
    );
    if (!activeLink) return null;
    if (!activeLink.canViewLessonNotes || parentPolicy.canViewLessonNotes === false) {
      return {
        canView: false,
        items: [],
      };
    }

    const rows = store.lessonNoteStudents
      .filter((link) => link.studentId === studentId && link.isVisibleToStudent !== false)
      .map((link) => {
        const note = store.lessonNotes.find((item) => item.id === link.lessonNoteId) || null;
        if (!note) return null;
        if (note.isSharedToStudents === false) return null;
        return {
          id: note.id,
          lessonUnitId: note.lessonUnitId || null,
          title: note.title || "レッスンノート",
          date: note.date || null,
          summary: note.summary || "",
          content: note.content || "",
          homeworkSummary: note.homeworkSummary || "",
          nextLessonPlan: note.nextLessonPlan || "",
          studentFeedbackSummary: link.studentFeedbackSummary || "",
          reservationId: link.reservationId || null,
          updatedAt: note.updatedAt || note.createdAt || null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => String(b.date || b.updatedAt || "").localeCompare(String(a.date || a.updatedAt || "")));

    return {
      canView: true,
      items: rows,
    };
  });
}

function parseDateMs(dateText) {
  const raw = String(dateText || "").trim();
  if (!raw) return null;
  const withTime = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const ms = new Date(withTime).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function startOfCurrentMonthMs() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function getPeriodStartMs(period) {
  const now = Date.now();
  if (period === "all") return 0;
  const days = period === "90" ? 90 : 30;
  return now - days * 24 * 60 * 60 * 1000;
}

function extractThemeKeywords(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/[ ,、。・/\-|:()\[\]{}]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !["です", "ます", "する", "した", "こと", "ため", "予定"].includes(token));
}

function summarizeThemes(notes, max = 5) {
  const counts = new Map();
  notes.forEach((note) => {
    const keywords = [
      ...extractThemeKeywords(note.title),
      ...extractThemeKeywords(note.summary),
    ];
    keywords.forEach((keyword) => {
      counts.set(keyword, (counts.get(keyword) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([label, count]) => ({ label, count }));
}

function truncateText(text, max = 90) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}...`;
}

function buildWeeklyCounts(reservations) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekly = [];
  for (let i = 3; i >= 0; i -= 1) {
    const from = new Date(start);
    from.setDate(from.getDate() - i * 7 - 6);
    const to = new Date(start);
    to.setDate(to.getDate() - i * 7);
    const fromMs = from.getTime();
    const toMs = to.getTime() + 24 * 60 * 60 * 1000 - 1;
    const count = reservations.filter((item) => {
      const ms = parseDateMs(item.date);
      if (ms === null) return false;
      return ms >= fromMs && ms <= toMs;
    }).length;
    weekly.push({
      label: `${String(from.getMonth() + 1).padStart(2, "0")}/${String(from.getDate()).padStart(2, "0")}`,
      count,
    });
  }
  return weekly;
}

function buildLearningStatsPayload({ student, reservations, notes, homeworks = [], period, mode = "admin" }) {
  const periodStartMs = getPeriodStartMs(period);
  const monthStartMs = startOfCurrentMonthMs();
  const completedReservations = reservations.filter((item) => item.status === "completed");
  const recentReservations = completedReservations.filter((item) => {
    const ms = parseDateMs(item.date);
    if (ms === null) return false;
    return ms >= periodStartMs;
  });
  const monthReservations = completedReservations.filter((item) => {
    const ms = parseDateMs(item.date);
    if (ms === null) return false;
    return ms >= monthStartMs;
  });
  const recentNotes = notes.filter((note) => {
    const ms = parseDateMs(note.date || note.updatedAt || note.createdAt);
    if (ms === null) return false;
    return ms >= periodStartMs;
  });
  const sortedRecentNotes = [...recentNotes].sort((a, b) =>
    String(b.date || b.updatedAt || "").localeCompare(String(a.date || a.updatedAt || ""))
  );
  const latestLessonDate =
    [...completedReservations]
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0]?.date || null;
  const latestNote = [...notes].sort((a, b) =>
    String(b.date || b.updatedAt || "").localeCompare(String(a.date || a.updatedAt || ""))
  )[0] || null;
  const currentTheme = latestNote?.title || latestNote?.summary || "現在進行中のテーマを準備中";
  const themeTags = summarizeThemes(sortedRecentNotes, 6);
  const reviewPoints = sortedRecentNotes
    .map((note) => truncateText(note.content || note.summary || ""))
    .filter(Boolean)
    .slice(0, 4);
  const homeworkFlow = [
    ...homeworks
      .sort((a, b) => String(b.lessonDate || b.updatedAt || "").localeCompare(String(a.lessonDate || a.updatedAt || "")))
      .map((item) => truncateText(item.title || item.description || ""))
      .filter(Boolean)
      .slice(0, 4),
    ...sortedRecentNotes
      .map((note) => truncateText(note.homeworkSummary || ""))
      .filter(Boolean)
      .slice(0, 4),
  ].filter((value, index, arr) => value && arr.indexOf(value) === index).slice(0, 4);
  const completedHomeworkCount = homeworks.filter((item) =>
    ["reviewed", "completed"].includes(String(item.status || ""))
  ).length;
  const inProgressHomeworkCount = homeworks.filter((item) =>
    ["not_started", "in_progress", "submitted"].includes(String(item.status || ""))
  ).length;
  const teacherComments = sortedRecentNotes
    .map((note) => truncateText(note.nextLessonPlan || note.studentFeedbackSummary || ""))
    .filter(Boolean)
    .slice(0, 4);
  const lessonNoteSharedCount = notes.filter((note) => note.isSharedToStudents !== false).length;
  const continuityCount = recentReservations.length;
  const continuityLabel =
    continuityCount >= 8
      ? "学習継続は非常に安定しています。"
      : continuityCount >= 4
      ? "学習継続は良好です。"
      : continuityCount >= 1
      ? "学習ペースを少しずつ増やすと効果的です。"
      : "最近の受講が少ないため、復習中心で再開を推奨します。";

  const studentMessage =
    continuityCount >= 4
      ? "今月もよく頑張っています。この流れで復習を続けましょう。"
      : "最近のテーマを復習すると次のレッスンがもっと楽になります。";
  const parentMessage =
    continuityCount >= 4
      ? "今月は継続的に受講できています。会話練習の比重が増えています。"
      : "受講回数が少なめのため、宿題と復習を中心に学習を支えると効果的です。";
  const staffMessage =
    teacherComments[0] || "次回は直近ノートの復習ポイントを優先して進行してください。";

  return {
    student: {
      id: student.id,
      nameKanji: student.nameKanji || "",
      studentNumber: student.studentNumber || null,
    },
    period,
    summary: {
      totalLessonCount: completedReservations.length,
      monthLessonCount: monthReservations.length,
      periodLessonCount: recentReservations.length,
      latestLessonDate,
      latestLessonNoteDate: latestNote?.date || latestNote?.updatedAt || null,
      currentLearningTheme: currentTheme,
      recentHomeworkExists: homeworkFlow.length > 0,
      lessonNoteSharedCount,
      homeworkTotalCount: homeworks.length,
      homeworkCompletedCount: completedHomeworkCount,
      homeworkInProgressCount: inProgressHomeworkCount,
    },
    cards: {
      basic: {
        totalLessonCount: completedReservations.length,
        monthLessonCount: monthReservations.length,
        latestLessonDate,
      },
      themes: themeTags,
      reviewPoints,
      teacherComment: staffMessage,
    },
    weeklyLessonCounts: buildWeeklyCounts(completedReservations),
    recentThemes: themeTags,
    reviewPoints,
    homeworkFlow,
    teacherComments,
    continuityLabel,
    motivationMessages: {
      student: studentMessage,
      parent: parentMessage,
      staff: staffMessage,
    },
    contextHints: {
      mode,
      showSensitive:
        mode === "admin" || mode === "teacher",
    },
  };
}

function lessonNoteHasAudioHint(note) {
  const raw = `${note?.content || ""}${note?.summary || ""}`;
  if (!raw.trim()) return false;
  if (/<audio[\s>]/i.test(raw)) return true;
  if (/\.(mp3|m4a|wav|ogg)(\?|#|$)/i.test(raw)) return true;
  if (/https?:\/\/[^\s"'<>]+\.(mp3|m4a|wav|ogg)/i.test(raw)) return true;
  return false;
}

function collectLessonNotesByStudent(store, studentId, options = {}) {
  const includePrivate = options.includePrivate !== false;
  const links = store.lessonNoteStudents.filter((link) => String(link.studentId || "") === String(studentId || ""));
  return links
    .map((link) => {
      const note = store.lessonNotes.find((item) => item.id === link.lessonNoteId) || null;
      if (!note) return null;
      if (!includePrivate && (note.isSharedToStudents === false || link.isVisibleToStudent === false)) return null;
      const teacher =
        note.teacherUserId && Array.isArray(store.users)
          ? store.users.find((u) => String(u.id) === String(note.teacherUserId))
          : null;
      return {
        id: note.id,
        lessonUnitId: note.lessonUnitId || null,
        date: note.date || null,
        title: note.title || "",
        summary: note.summary || "",
        content: note.content || "",
        homeworkSummary: note.homeworkSummary || "",
        nextLessonPlan: note.nextLessonPlan || "",
        studentFeedbackSummary: link.studentFeedbackSummary || "",
        isSharedToStudents: note.isSharedToStudents !== false,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        teacherName: teacher?.displayName || teacher?.email || "",
        hasAudio: lessonNoteHasAudioHint(note),
      };
    })
    .filter(Boolean);
}

function collectHomeworksByStudent(store, studentId, options = {}) {
  const includePrivate = options.includePrivate !== false;
  return store.homeworks
    .filter((item) => String(item.studentId || "") === String(studentId || ""))
    .filter((item) => (includePrivate ? true : item.isPublished !== false))
    .map((item) => toHomeworkDto(store, item));
}

export async function getStudentLearningStatsForAdmin(studentId, options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const student = store.students.find((item) => item.id === String(studentId || "").trim()) || null;
    if (!student) return null;
    migrateStudentShape(student);
    const period = String(options?.period || "30").trim();
    const reservations = store.reservations
      .filter((item) => item.studentId === student.id)
      .map((item) => toReservationDto(item, student));
    const notes = collectLessonNotesByStudent(store, student.id, { includePrivate: true });
    const homeworks = collectHomeworksByStudent(store, student.id, { includePrivate: true });
    return buildLearningStatsPayload({ student, reservations, notes, homeworks, period, mode: "admin" });
  });
}

export async function getStudentLearningStatsForTeacher(studentId, options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const student = store.students.find((item) => item.id === String(studentId || "").trim()) || null;
    if (!student) return null;
    migrateStudentShape(student);
    const period = String(options?.period || "30").trim();
    const reservations = store.reservations
      .filter((item) => item.studentId === student.id)
      .map((item) => toReservationDto(item, student));
    const notes = collectLessonNotesByStudent(store, student.id, { includePrivate: true });
    const homeworks = collectHomeworksByStudent(store, student.id, { includePrivate: true });
    return buildLearningStatsPayload({ student, reservations, notes, homeworks, period, mode: "teacher" });
  });
}

export async function listStudentsForTeacherOverview() {
  return enqueue(async () => {
    const store = await readStore();
    return store.students
      .map((student) => {
        migrateStudentShape(student);
        return {
          id: student.id,
          studentNumber: student.studentNumber || null,
          nameKanji: student.nameKanji || "",
          nameFurigana: student.nameFurigana || "",
          email: student.email || "",
        };
      })
      .sort((a, b) => String(a.nameKanji || "").localeCompare(String(b.nameKanji || "")));
  });
}

export async function getStudentLearningStatsForStudent(userId, options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    migrateStudentShape(student);
    const period = String(options?.period || "30").trim();
    const reservations = store.reservations
      .filter((item) => item.studentId === student.id)
      .map((item) => toReservationDto(item, student));
    const notes = collectLessonNotesByStudent(store, student.id, { includePrivate: false });
    const homeworks = collectHomeworksByStudent(store, student.id, { includePrivate: false });
    return buildLearningStatsPayload({ student, reservations, notes, homeworks, period, mode: "student" });
  });
}

export async function getStudentLearningStatsForParentChild(parentUserId, studentId, options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensureSystemSettings(store);
    const parentPolicy = getParentPolicySettings(store);
    if (parentPolicy.parentAccountEnabled === false) {
      return {
        canView: false,
        permissions: {
          canViewReservations: false,
          canViewLessonNotes: false,
          canViewHomework: false,
        },
      };
    }
    const activeLink = listActiveParentLinksByUser(store, parentUserId).find(
      (link) => link.studentId === studentId
    );
    if (!activeLink) return null;
    if (parentPolicy.canViewProgress === false) {
      return {
        canView: false,
        permissions: {
          canViewReservations: false,
          canViewLessonNotes: false,
          canViewHomework: false,
        },
      };
    }
    const student = store.students.find((item) => item.id === studentId) || null;
    if (!student) return null;
    migrateStudentShape(student);
    const period = String(options?.period || "30").trim();
    const reservations = Boolean(activeLink.canViewReservations) && parentPolicy.canViewReservations !== false
      ? store.reservations
          .filter((item) => item.studentId === student.id)
          .map((item) => toReservationDto(item, student))
      : [];
    const notes = Boolean(activeLink.canViewLessonNotes) && parentPolicy.canViewLessonNotes !== false
      ? collectLessonNotesByStudent(store, student.id, { includePrivate: false })
      : [];
    const homeworks = Boolean(activeLink.canViewHomework) && parentPolicy.canViewHomework !== false
      ? collectHomeworksByStudent(store, student.id, { includePrivate: false })
      : [];
    const payload = buildLearningStatsPayload({ student, reservations, notes, homeworks, period, mode: "parent" });
    return {
      canView:
        (Boolean(activeLink.canViewLessonNotes) && parentPolicy.canViewLessonNotes !== false) ||
        (Boolean(activeLink.canViewReservations) && parentPolicy.canViewReservations !== false),
      permissions: {
        canViewReservations:
          Boolean(activeLink.canViewReservations) && parentPolicy.canViewReservations !== false,
        canViewLessonNotes:
          Boolean(activeLink.canViewLessonNotes) && parentPolicy.canViewLessonNotes !== false,
        canViewHomework: Boolean(activeLink.canViewHomework) && parentPolicy.canViewHomework !== false,
      },
      ...payload,
    };
  });
}

export async function listReservationsForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();

    const rows = store.reservations
      .map((reservation) => {
        const student = store.students.find((s) => s.id === reservation.studentId) || null;
        const link = student
          ? store.userStudentLinks.find((l) => l.studentId === student.id)
          : null;
        const user = link ? store.users.find((u) => u.id === link.userId) : null;
        return toReservationDto(reservation, student, user);
      })
      .sort(reservationSortDesc);

    const filtered = filterReservations(rows, filters);
    return paginate(filtered, filters.page, filters.pageSize);
  });
}

export async function updateReservationByAdmin(reservationId, patch, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    const reservation = store.reservations.find((item) => item.id === reservationId);
    if (!reservation) return null;

    const prevStatus = reservation.status;
    const prevAttendanceStatus = normalizeAttendanceStatus(reservation.attendanceStatus || "scheduled");
    const nextStatus =
      patch?.status !== undefined
        ? normalizeReservationStatus(patch.status)
        : reservation.status;
    const nextAttendanceStatus =
      patch?.attendanceStatus !== undefined
        ? normalizeAttendanceStatus(patch.attendanceStatus)
        : nextStatus === "completed" && prevAttendanceStatus === "scheduled"
          ? "attended"
        : prevAttendanceStatus;
    const nextMemo = patch?.memo !== undefined ? String(patch.memo || "").trim() : reservation.memo;
    const nextLessonDeliveryType =
      patch?.lessonDeliveryType !== undefined
        ? normalizeLessonDeliveryType(patch.lessonDeliveryType)
        : normalizeLessonDeliveryType(reservation.lessonDeliveryType || "in_person");

    const currentSlot = reservation.slotId ? findSlotById(store, reservation.slotId) : null;
    let targetSlot = currentSlot;
    const requestedSlotId = String(patch?.slotId || "").trim();
    const isSlotChanged = Boolean(requestedSlotId && requestedSlotId !== reservation.slotId);
    if (requestedSlotId) {
      targetSlot = findSlotById(store, requestedSlotId);
      if (!targetSlot) {
        throw new Error("변경할 슬롯을 찾을 수 없습니다.");
      }
    }

    reservation.status = nextStatus;
    reservation.attendanceStatus = nextAttendanceStatus;
    reservation.lessonDeliveryType = nextLessonDeliveryType;
    reservation.memo = nextMemo;
    if (patch?.date !== undefined) reservation.date = normalizeReservationDate(patch.date);
    if (patch?.time !== undefined) reservation.time = normalizeReservationTime(patch.time);
    if (patch?.durationMinutes !== undefined) {
      reservation.durationMinutes = Math.max(30, Number(patch.durationMinutes || reservation.durationMinutes));
    }
    if (targetSlot && isSlotChanged) {
      const studentConflict = validateStudentConflict(
        store,
        reservation.studentId,
        targetSlot.date,
        targetSlot.time,
        targetSlot.durationMinutes,
        reservation.id
      );
      if (!studentConflict.ok && reservation.status !== "cancelled") {
        throw new Error("학생 기준 충돌로 인해 상태를 변경할 수 없습니다.");
      }

      const operationConflict = validateOperationConflict(store, targetSlot, reservation.id);
      if (!operationConflict.ok && reservation.status !== "cancelled") {
        throw new Error("슬롯 충돌로 인해 상태를 변경할 수 없습니다.");
      }
    }

    if (targetSlot && isSlotChanged) {
      reservation.slotId = targetSlot.id;
      reservation.date = targetSlot.date;
      reservation.time = targetSlot.time;
      reservation.durationMinutes = targetSlot.durationMinutes;
      reservation.slotStatus = targetSlot.status;
      reservation.slotLessonMode = normalizeLessonMode(targetSlot.lessonMode || "one_on_one");
      reservation.instructorUserId = normalizeInstructorUserId(targetSlot.instructorUserId);
      reservation.instructorName = resolveInstructorName(store, targetSlot.instructorUserId);
    }

    if (
      targetSlot &&
      isSlotChanged &&
      reservation.status !== "cancelled" &&
      reservation.status !== "rejected"
    ) {
      const stR = store.students.find((s) => s.id === reservation.studentId);
      if (stR) {
        migrateStudentShape(stR);
        const newCost = resolveReservationPointCost(store, {
          lessonServiceId: reservation.lessonServiceId,
          durationMinutes: reservation.durationMinutes,
        });
        applyReservationPointRescheduleDelta(store, stR, reservation, newCost, actor, "admin");
      }
    }

    if (reservation.status === "cancelled" || reservation.status === "rejected") {
      reservation.cancelledAt = nowIso();
      reservation.cancelledByRole = actor?.role || "admin";
      reservation.cancelledByUserId = actor?.userId || null;
      reservation.attendanceStatus = "scheduled";
      reservation.attendanceMarkedAt = null;
      reservation.attendanceMarkedByRole = null;
      reservation.attendanceMarkedByUserId = null;
      if (LESSON_MINUTES_REFUND_ON_ADMIN_CANCEL && reservation.status === "cancelled") {
        applyLessonMinuteRefundForCancellation(store, reservation, actor, "admin");
      }
      const wasTerminal = prevStatus === "cancelled" || prevStatus === "rejected";
      if (!wasTerminal) {
        const stC = store.students.find((s) => s.id === reservation.studentId);
        if (stC) {
          migrateStudentShape(stC);
          applyReservationPointRefundOnCancel(store, stC, reservation, "admin", actor);
        }
      }
    } else if (prevStatus === "cancelled" || prevStatus === "rejected") {
      reservation.cancelledAt = null;
      reservation.cancelledByRole = null;
      reservation.cancelledByUserId = null;
    }

    if (patch?.attendanceStatus !== undefined && reservation.status !== "cancelled") {
      if (reservation.attendanceStatus === "scheduled") {
        reservation.attendanceMarkedAt = null;
        reservation.attendanceMarkedByRole = null;
        reservation.attendanceMarkedByUserId = null;
      } else {
        reservation.attendanceMarkedAt = nowIso();
        reservation.attendanceMarkedByRole = actor?.role || "admin";
        reservation.attendanceMarkedByUserId = actor?.userId || null;
      }
    }

    if (nextStatus === "completed" && prevAttendanceStatus === "scheduled" && patch?.attendanceStatus === undefined) {
      reservation.attendanceMarkedAt = nowIso();
      reservation.attendanceMarkedByRole = actor?.role || "admin";
      reservation.attendanceMarkedByUserId = actor?.userId || null;
    }

    const completedTransition = nextStatus === "completed" && prevStatus !== "completed";
    const attendedLike =
      reservation.attendanceStatus === "attended" ||
      (LESSON_MINUTES_DEDUCT_ON_NO_SHOW && reservation.attendanceStatus === "no_show");
    if (LESSON_MINUTES_DEDUCT_ON_COMPLETION_ONLY && !LESSON_MINUTES_DEDUCT_ON_ATTENDED_LEGACY) {
      if (completedTransition && attendedLike && reservation.status !== "cancelled") {
        applyLessonMinuteDeduction(store, reservation, actor);
      }
    } else if (
      ["attended", LESSON_MINUTES_DEDUCT_ON_NO_SHOW ? "no_show" : ""].filter(Boolean).includes(
        reservation.attendanceStatus
      ) &&
      reservation.status !== "cancelled"
    ) {
      applyLessonMinuteDeduction(store, reservation, actor);
    }

    reservation.updatedAt = nowIso();

    const student = store.students.find((s) => s.id === reservation.studentId) || null;

    appendReservationHistory(reservation, {
      action:
        patch?.attendanceStatus !== undefined
          ? "admin_attendance_marked"
          : reservation.status === "rejected"
          ? "admin_rejected"
          : reservation.status === "cancelled"
          ? "admin_cancelled"
          : reservation.status === "change_requested"
          ? "admin_change_requested"
          : prevStatus !== reservation.status
            ? "admin_status_changed"
            : "admin_updated",
      actorRole: actor?.role || "admin",
      actorUserId: actor?.userId || null,
      summary:
        patch?.attendanceStatus !== undefined
          ? "관리자가 출석 상태를 처리했습니다."
          : reservation.status === "rejected"
          ? "관리자가 예약을 거절했습니다."
          : reservation.status === "cancelled"
          ? "관리자가 예약을 취소했습니다."
          : reservation.status === "change_requested"
          ? "관리자가 예약 변경을 요청했습니다."
          : "관리자가 예약 정보를 수정했습니다.",
      meta: {
        fromStatus: prevStatus,
        toStatus: reservation.status,
        fromAttendanceStatus: prevAttendanceStatus,
        toAttendanceStatus: reservation.attendanceStatus,
        slotId: reservation.slotId,
      },
    });

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action:
        patch?.attendanceStatus !== undefined
          ? "reservation.admin_attendance_marked"
          : reservation.status === "rejected"
          ? "reservation.admin_rejected"
          : reservation.status === "cancelled"
          ? "reservation.admin_cancelled"
          : reservation.status === "change_requested"
          ? "reservation.admin_change_requested"
          : "reservation.admin_updated",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `Admin updated reservation ${reservation.id}`,
      meta: {
        studentId: reservation.studentId,
        status: reservation.status,
        attendanceStatus: reservation.attendanceStatus,
        fromStatus: prevStatus,
        toStatus: reservation.status,
        date: reservation.date,
        time: reservation.time,
        slotId: reservation.slotId,
        slotChanged: Boolean(isSlotChanged),
      },
    });
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "reservation.updated",
      targetType: "reservation",
      targetId: reservation.id,
      summary: `予約更新 (管理者) ${reservation.date} ${reservation.time}`,
      meta: {
        studentId: reservation.studentId,
        fromStatus: prevStatus,
        toStatus: reservation.status,
        date: reservation.date,
        time: reservation.time,
        slotId: reservation.slotId,
        attendanceStatus: reservation.attendanceStatus,
        source: "admin",
      },
    });
    if (reservation.status === "cancelled" && prevStatus !== "cancelled") {
      writeAuditLog(store, {
        actorUserId: actor?.userId || null,
        actorRole: actor?.role || "admin",
        action: "reservation.cancelled",
        targetType: "reservation",
        targetId: reservation.id,
        summary: `予約キャンセル (管理者) ${reservation.date} ${reservation.time}`,
        meta: {
          studentId: reservation.studentId,
          previousStatus: prevStatus,
          date: reservation.date,
          time: reservation.time,
          slotId: reservation.slotId,
          source: "admin",
        },
      });
    }

    if (reservation.status === "completed" && prevStatus !== "completed") {
      writeAuditLog(store, {
        actorUserId: actor?.userId || null,
        actorRole: actor?.role || "admin",
        action: "reservation.completed",
        targetType: "reservation",
        targetId: reservation.id,
        summary: `予約完了 (管理者) ${reservation.date} ${reservation.time}`,
        meta: {
          studentId: reservation.studentId,
          previousStatus: prevStatus,
          date: reservation.date,
          time: reservation.time,
          slotId: reservation.slotId,
          attendanceStatus: reservation.attendanceStatus,
          source: "admin",
        },
      });
    }

    await writeStore(store);
    return toReservationDto(reservation, student);
  });
}

function computeAdminPaymentPreview(store, body = {}) {
  ensurePaymentModule(store);
  const studentId = String(body?.studentId || "").trim();
  const student = store.students.find((s) => s.id === studentId);
  if (!student) {
    throw new Error("学生が見つかりません。");
  }
  migrateStudentShape(student);
  const paidAtIso = String(body?.paidAt || "").trim() || nowIso();
  const resolved = resolvePaymentRuleForStudent(store, studentId, paidAtIso);
  const txKind = String(body?.transactionKind || "payment").trim() === "point_grant" ? "point_grant" : "payment";
  const taxRate = Number(store.paymentGlobalRule?.taxRatePercent ?? 10);
  const calc = PaymentEngine.buildPaymentCalculation({
    transactionKind: txKind,
    pointConversionRules: store.pointConversionRules,
    pointTimeConversionRules: store.pointTimeConversionRules,
    globalBonusTiers: store.paymentGlobalRule.bonusTiers || [],
    taxRatePercent: taxRate,
    taxInputMode: body?.taxInputMode,
    inputAmountYen: body?.inputAmountYen,
    manualPoints: body?.manualPoints,
    manualReason: body?.manualReason,
    resolvedLayer: resolved.layer,
    template: resolved.template,
    paidAtIso,
  });
  const ruleId =
    resolved.layer === "basic" ? "global-basic" : resolved.templateId || resolved.template?.id || "rule-template";
  const snapshot = buildPaymentRuleSnapshot(store, resolved, calc, ruleId);
  const lastPayment = [...store.paymentTransactions]
    .filter((t) => t.studentId === studentId)
    .sort((a, b) => String(b.paidAt || "").localeCompare(String(a.paidAt || "")))[0];
  return {
    student: {
      id: student.id,
      studentNumber: student.studentNumber,
      nameKanji: student.nameKanji,
      nameFurigana: student.nameFurigana,
      enrollmentOrStart: student.createdAt || null,
      email: student.email,
      pointsBalance: student.points?.balance ?? 0,
      lessonMinutes: student.lessonMinutes,
      lastPaymentAt: lastPayment?.paidAt || null,
    },
    resolvedLayer: resolved.layer,
    resolved,
    calc,
    snapshot,
    appliedRuleId: ruleId,
  };
}

function paymentRuleLabel(layer) {
  if (layer === "individual") return "個別設定";
  if (layer === "bulk") return "一括設定";
  return "基本設定";
}

export async function previewPaymentForAdmin(body = {}) {
  return enqueue(async () => {
    const store = await readStore();
    return computeAdminPaymentPreview(store, body);
  });
}

export async function commitPaymentForAdmin(body = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const preview = computeAdminPaymentPreview(store, body);
    const { student, calc, snapshot, appliedRuleId } = preview;
    const st = store.students.find((s) => s.id === student.id);
    if (!st) throw new Error("学生が見つかりません。");
    migrateStudentShape(st);

    if (calc.transactionKind === "payment" && calc.tax.amountTaxInclusive <= 0 && calc.finalPoints <= 0) {
      throw new Error("決済金額または付与ポイントを入力してください。");
    }
    if (calc.transactionKind === "point_grant" && calc.finalPoints <= 0) {
      throw new Error("付与ポイントを入力してください。");
    }

    const txId = newId();
    const paidAtIso = String(body?.paidAt || "").trim() || nowIso();
    const paymentMethod =
      String(body?.paymentMethod || (calc.transactionKind === "point_grant" ? "その他" : "現金")).trim() || "現金";
    const note = String(body?.note || "").trim();
    const pointGrantCategory = String(body?.pointGrantCategory || "").trim() || null;

    const transaction = {
      id: txId,
      status: "completed",
      transactionKind: calc.transactionKind,
      pointGrantCategory,
      studentId: st.id,
      studentNameSnapshot: String(st.nameKanji || "").trim(),
      studentNumberSnapshot: String(st.studentNumber || "").trim(),
      paymentMethod,
      paidAt: paidAtIso,
      note,
      taxInputMode: calc.tax.taxInputMode,
      taxRatePercent: calc.tax.taxRatePercent,
      amountTaxExclusive: calc.tax.amountTaxExclusive,
      taxAmount: calc.tax.taxAmount,
      amountTaxInclusive: calc.tax.amountTaxInclusive,
      appliedRuleType: calc.appliedRuleType,
      appliedRuleId,
      ruleSnapshot: snapshot,
      basePoints: calc.basePoints,
      bonusPoints: calc.bonusPoints,
      manualPoints: calc.manualPoints,
      manualReason: calc.manualReason,
      finalPoints: calc.finalPoints,
      grantedMinutes: calc.grantedMinutes,
      registeredByUserId: actor?.userId || null,
      registeredAt: nowIso(),
      receiptIssuedAt: null,
      ryoshuIssuedAt: null,
    };

    store.paymentTransactions.push(transaction);

    const beforePoints = Number(st.points?.balance || 0);
    st.points.balance = Math.max(0, beforePoints + calc.finalPoints);
    st.points.updatedAt = nowIso();
    st.updatedAt = st.points.updatedAt;

    if (calc.grantedMinutes > 0) {
      applyStudentLessonMinuteCredit(
        store,
        st,
        calc.grantedMinutes,
        actor,
        "purchase",
        `payment_tx:${txId}`,
        { id: txId, name: "payment" }
      );
    }
    appendPaymentEvent(store, {
      at: transaction.registeredAt,
      eventType: "PAYMENT",
      studentId: st.id,
      transactionId: txId,
      reason: calc.transactionKind,
      actorRole: actor?.role || "admin",
      actorUserId: actor?.userId || null,
      payloadSnapshot: {
        transactionKind: calc.transactionKind,
        amountTaxInclusive: Number(transaction.amountTaxInclusive || 0),
        finalPoints: Number(transaction.finalPoints || 0),
        grantedMinutes: Number(transaction.grantedMinutes || 0),
      },
      ruleSnapshot: transaction.ruleSnapshot || null,
      resultSnapshot: buildEventResultSnapshot(st),
    });

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "payment.transaction_created",
      targetType: "payment_transaction",
      targetId: txId,
      summary: `Payment ${calc.transactionKind} registered for ${st.email || st.id}`,
      meta: {
        studentId: st.id,
        finalPoints: calc.finalPoints,
        grantedMinutes: calc.grantedMinutes,
        appliedRuleType: calc.appliedRuleType,
      },
    });

    await writeStore(store);

    let mailResult = { studentSent: false, officeSent: false };
    try {
      const mod = await import("./email.js");
      if (typeof mod.sendPaymentCompletedMails === "function") {
        mailResult = await mod.sendPaymentCompletedMails({
          transaction,
          student: st,
          actor,
        });
      }
    } catch (e) {
      console.error("payment mail error", e);
    }

    const completionLogId = newId();
    store.paymentCompletionLogs.push({
      id: completionLogId,
      transactionId: txId,
      createdAt: nowIso(),
      frozenSnapshot: {
        transaction: JSON.parse(JSON.stringify(transaction)),
        studentPointsAfter: Number(st.points?.balance || 0),
        studentRemainingMinutesAfter: Number(st.lessonMinutes?.remainingMinutes || 0),
      },
      mailDispatch: mailResult,
    });
    await writeStore(store);

    return {
      transaction,
      studentPreview: preview.student,
      studentAfter: {
        nameKanji: String(st.nameKanji || "").trim(),
        studentNumber: String(st.studentNumber || "").trim(),
        pointsBalance: Number(st.points?.balance || 0),
        remainingMinutes: Number(st.lessonMinutes?.remainingMinutes || 0),
      },
      completionLogId,
      mails: mailResult,
    };
  });
}

/**
 * 既存取引を変更せず、新規取引として調整（取消・ポイント減算・時間減算・金額修正）
 */
export async function commitPaymentAdjustmentForAdmin(body = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const studentId = String(body?.studentId || "").trim();
    const st = store.students.find((s) => s.id === studentId);
    if (!st) throw new Error("学生が見つかりません。");
    migrateStudentShape(st);

    const subtype = String(body?.adjustmentSubtype || "manual").trim();
    const note = String(body?.note || "").trim();
    if (!note) throw new Error("調整理由を入力してください。");
    const paidAtIso = String(body?.paidAt || "").trim() || nowIso();
    const relatedId = String(body?.relatedTransactionId || "").trim() || null;

    let deltaPoints = Math.round(Number(body?.deltaPoints ?? 0));
    let deltaMinutes = Math.round(Number(body?.deltaMinutes ?? 0));
    let amountTaxInclusive = Math.round(Number(body?.amountTaxInclusive ?? 0));
    let amountTaxExclusive = amountTaxInclusive;
    let taxAmount = 0;

    if (subtype === "reversal") {
      if (!relatedId) throw new Error("取消対象の取引IDを指定してください。");
      const orig = store.paymentTransactions.find((t) => t.id === relatedId);
      if (!orig || orig.studentId !== st.id) throw new Error("対象の取引が見つかりません。");
      deltaPoints = -Math.abs(Number(orig.finalPoints || 0));
      deltaMinutes = -Math.abs(Number(orig.grantedMinutes || 0));
      amountTaxInclusive = -Math.abs(Number(orig.amountTaxInclusive || 0));
      amountTaxExclusive = -Math.abs(Number(orig.amountTaxExclusive ?? orig.amountTaxInclusive ?? 0));
      taxAmount = -Math.abs(Number(orig.taxAmount || 0));
    } else {
      if (
        deltaPoints === 0 &&
        deltaMinutes === 0 &&
        amountTaxInclusive === 0
      ) {
        throw new Error("ポイント・時間・金額のいずれかを入力してください。");
      }
    }

    const txId = newId();
    const beforePts = Number(st.points?.balance || 0);
    st.points.balance = Math.max(0, beforePts + deltaPoints);
    st.points.updatedAt = nowIso();
    st.updatedAt = st.points.updatedAt;

    if (deltaMinutes < 0) {
      applyStudentLessonMinuteDebit(store, st, Math.abs(deltaMinutes), actor, note || `adjustment:${txId}`, txId);
    } else if (deltaMinutes > 0) {
      applyStudentLessonMinuteCredit(
        store,
        st,
        deltaMinutes,
        actor,
        "manual_adjustment",
        `adjustment_tx:${txId}`,
        { id: txId, name: "adjustment" }
      );
    }

    const transaction = {
      id: txId,
      status: "completed",
      transactionKind: "adjustment",
      adjustmentSubtype: subtype,
      relatedTransactionId: relatedId,
      pointGrantCategory: null,
      studentId: st.id,
      studentNameSnapshot: String(st.nameKanji || "").trim(),
      studentNumberSnapshot: String(st.studentNumber || "").trim(),
      paymentMethod: "調整",
      paidAt: paidAtIso,
      note,
      taxInputMode: "inclusive",
      taxRatePercent: 0,
      amountTaxExclusive,
      taxAmount,
      amountTaxInclusive,
      appliedRuleType: "adjustment",
      appliedRuleId: null,
      ruleSnapshot: {
        version: 1,
        kind: "adjustment",
        adjustmentSubtype: subtype,
        relatedTransactionId: relatedId,
        deltaPoints,
        deltaMinutes,
      },
      basePoints: 0,
      bonusPoints: 0,
      manualPoints: deltaPoints,
      manualReason: note,
      finalPoints: deltaPoints,
      grantedMinutes: deltaMinutes,
      registeredByUserId: actor?.userId || null,
      registeredAt: nowIso(),
      receiptIssuedAt: null,
      ryoshuIssuedAt: null,
    };

    store.paymentTransactions.push(transaction);
    appendPaymentEvent(store, {
      at: transaction.registeredAt,
      eventType: subtype === "reversal" ? "CANCEL" : "ADJUSTMENT",
      studentId: st.id,
      transactionId: txId,
      relatedTransactionId: relatedId,
      reason: note,
      actorRole: actor?.role || "admin",
      actorUserId: actor?.userId || null,
      payloadSnapshot: {
        adjustmentSubtype: subtype,
        deltaPoints,
        deltaMinutes,
        amountTaxInclusive,
      },
      ruleSnapshot: transaction.ruleSnapshot || null,
      resultSnapshot: buildEventResultSnapshot(st),
    });

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "payment.adjustment_created",
      targetType: "payment_transaction",
      targetId: txId,
      summary: `Payment adjustment ${subtype} for ${st.id}`,
      meta: { studentId: st.id, deltaPoints, deltaMinutes, relatedTransactionId: relatedId },
    });

    await writeStore(store);

    return {
      transaction,
      studentAfter: {
        nameKanji: String(st.nameKanji || "").trim(),
        studentNumber: String(st.studentNumber || "").trim(),
        pointsBalance: Number(st.points?.balance || 0),
        remainingMinutes: Number(st.lessonMinutes?.remainingMinutes || 0),
      },
    };
  });
}

export async function listPaymentEventsForAdmin(options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const studentId = String(options?.studentId || "").trim();
    const fromDate = String(options?.fromDate || "").trim();
    const toDate = String(options?.toDate || "").trim();
    const lim = Number(options?.limit || 200);
    const limit = Math.min(1000, Math.max(1, Number.isFinite(lim) ? lim : 200));
    let rows = [...store.paymentEvents].sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
    if (studentId) rows = rows.filter((e) => String(e.studentId || "") === studentId);
    if (fromDate) rows = rows.filter((e) => String(e.at || "").slice(0, 10) >= fromDate);
    if (toDate) rows = rows.filter((e) => String(e.at || "").slice(0, 10) <= toDate);
    return rows.slice(0, limit);
  });
}

export async function rebuildPaymentStateFromEventsForAdmin(options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const studentId = String(options?.studentId || "").trim();
    if (!studentId) throw new Error("studentId が必要です。");
    const student = store.students.find((s) => s.id === studentId);
    if (!student) throw new Error("学生が見つかりません。");
    migrateStudentShape(student);
    const asOf = String(options?.asOf || "").trim();
    let rows = [...store.paymentEvents]
      .filter((e) => String(e.studentId || "") === studentId && !e.isVoided)
      .sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
    if (asOf) rows = rows.filter((e) => String(e.at || "") <= asOf);

    const simulated = {
      pointsBalance: 0,
      totalMinutes: 0,
      usedMinutes: 0,
      remainingMinutes: 0,
    };

    rows.forEach((e) => {
      const snap = e?.resultSnapshot || null;
      if (!snap) return;
      simulated.pointsBalance = Number(snap.pointsBalance || simulated.pointsBalance || 0);
      simulated.totalMinutes = Number(snap.totalMinutes || simulated.totalMinutes || 0);
      simulated.usedMinutes = Number(snap.usedMinutes || simulated.usedMinutes || 0);
      simulated.remainingMinutes = Number(snap.remainingMinutes || simulated.remainingMinutes || 0);
    });

    const current = {
      pointsBalance: Number(student.points?.balance || 0),
      totalMinutes: Number(student.lessonMinutes?.totalMinutes || 0),
      usedMinutes: Number(student.lessonMinutes?.usedMinutes || 0),
      remainingMinutes: Number(student.lessonMinutes?.remainingMinutes || 0),
    };

    return {
      studentId,
      asOf: asOf || null,
      eventCount: rows.length,
      simulated,
      current,
      diff: {
        pointsBalance: simulated.pointsBalance - current.pointsBalance,
        totalMinutes: simulated.totalMinutes - current.totalMinutes,
        usedMinutes: simulated.usedMinutes - current.usedMinutes,
        remainingMinutes: simulated.remainingMinutes - current.remainingMinutes,
      },
    };
  });
}

function jstYmdPayment() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export async function sendPaymentOfficeSummaryMailForAdmin(actor, options = {}) {
  const preset = String(options.preset || "today").trim();
  const today = jstYmdPayment();
  let fromDate = today;
  let toDate = today;
  let rangeTitle = "daily";
  if (preset === "week") {
    const t = new Date();
    const jst = new Date(t.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    jst.setDate(jst.getDate() - 6);
    fromDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(jst);
    toDate = today;
    rangeTitle = "weekly";
  } else if (preset === "month") {
    const [y, m] = today.split("-");
    fromDate = `${y}-${m}-01`;
    toDate = today;
    rangeTitle = "monthly";
  } else {
    fromDate = today;
    toDate = today;
    rangeTitle = "daily";
  }
  const data = await getSalesDashboardForAdmin({ fromDate, toDate });
  const mod = await import("./email.js");
  const mailResult = await mod.sendPaymentOfficeSummaryMail({
    rangeTitle,
    fromDate,
    toDate,
    sum: data.sum,
    byMethod: data.byMethod,
    studentRows: data.studentRows,
  });
  return enqueue(async () => {
    const store = await readStore();
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "payment.summary_mail_sent",
      targetType: "payment_summary",
      targetId: `${fromDate}_${toDate}`,
      summary: `Payment summary mail (${preset})`,
      meta: { preset, fromDate, toDate },
    });
    await writeStore(store);
    return { ok: true, mails: mailResult, fromDate, toDate };
  });
}

export async function getPaymentTransactionForStudentPortal(userId, transactionId) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    const tid = String(transactionId || "").trim();
    const tx = store.paymentTransactions.find(
      (t) => t.id === tid && t.studentId === student.id && t.status === "completed",
    );
    return tx || null;
  });
}

export async function resendPaymentMailsForAdmin(transactionId, actor = null, options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const tid = String(transactionId || "").trim();
    const scope = String(options.scope || "both").trim();
    const tx = store.paymentTransactions.find((t) => t.id === tid) || null;
    if (!tx) throw new Error("取引が見つかりません。");
    const st = store.students.find((s) => s.id === tx.studentId);
    if (!st) throw new Error("学生が見つかりません。");
    migrateStudentShape(st);
    const mod = await import("./email.js");
    let studentResult = null;
    let officeResult = null;
    if (scope === "student" || scope === "both") {
      if (typeof mod.sendPaymentStudentMailOnly !== "function") {
        throw new Error("学生向けメール送信が利用できません。");
      }
      studentResult = await mod.sendPaymentStudentMailOnly({ transaction: tx, student: st, actor, attachPdf: true });
    }
    if (scope === "office" || scope === "both") {
      if (typeof mod.sendPaymentOfficeMailOnly !== "function") {
        throw new Error("教室向けメール送信が利用できません。");
      }
      officeResult = await mod.sendPaymentOfficeMailOnly({ transaction: tx, student: st, actor });
    }
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "payment.mails_resent",
      targetType: "payment_transaction",
      targetId: tid,
      summary: "Resent payment notification mails",
      meta: { scope },
    });
    await writeStore(store);
    return {
      ok: true,
      scope,
      student: studentResult,
      office: officeResult,
    };
  });
}

export async function searchStudentsForPaymentAdmin(q = "") {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const query = String(q || "").trim().toLowerCase();
    const rows = store.students.map((student) => {
      migrateStudentShape(student);
      const link = store.userStudentLinks.find((item) => item.studentId === student.id);
      const user = link ? store.users.find((item) => item.id === link.userId) : null;
      return toStudentDto(student, user, resolvePairInfoForStudent(store, student.id));
    });
    const filtered = query
      ? rows.filter((s) => {
          const hay = [
            s.nameKanji,
            s.nameFurigana,
            s.studentNumber,
            s.phone,
            s.email,
            s.crmProfile?.phoneMobile,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(query);
        })
      : rows.slice(0, 30);
    return filtered.slice(0, 50).map((s) => {
      const paidAt = nowIso();
      const r = resolvePaymentRuleForStudent(store, s.id, paidAt);
      return {
        ...s,
        currentRuleLabel: paymentRuleLabel(r.layer),
        currentRuleLayer: r.layer,
      };
    });
  });
}

export async function listRecentPaymentTransactionsForAdmin(options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const studentId = String(options?.studentId || "").trim();
    const fromDate = String(options?.fromDate || "").trim();
    const toDate = String(options?.toDate || "").trim();
    const lim = Number(options?.limit || 30);
    const limit = Math.min(500, Math.max(1, Number.isFinite(lim) ? lim : 30));
    let list = [...store.paymentTransactions].sort((a, b) =>
      String(b.paidAt || "").localeCompare(String(a.paidAt || ""))
    );
    if (studentId) list = list.filter((t) => t.studentId === studentId);
    if (fromDate) list = list.filter((t) => String(t.paidAt || "").slice(0, 10) >= fromDate);
    if (toDate) list = list.filter((t) => String(t.paidAt || "").slice(0, 10) <= toDate);
    return list.slice(0, limit);
  });
}

export async function getPaymentTransactionByIdForAdmin(transactionId) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    return store.paymentTransactions.find((t) => t.id === transactionId) || null;
  });
}

export async function softCancelPaymentTransactionForAdmin(transactionId, reason, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const tid = String(transactionId || "").trim();
    const why = String(reason || "").trim();
    if (!tid) throw new Error("transactionId が必要です。");
    if (!why) throw new Error("取消理由を入力してください。");
    const tx = store.paymentTransactions.find((t) => t.id === tid) || null;
    if (!tx) throw new Error("取引が見つかりません。");
    if (tx.status === "cancelled") {
      return { transaction: tx, alreadyCancelled: true };
    }
    tx.status = "cancelled";
    tx.cancelledAt = nowIso();
    tx.cancelledReason = why;
    tx.cancelledByUserId = actor?.userId || null;
    tx.updatedAt = tx.cancelledAt;

    appendPaymentEvent(store, {
      at: tx.cancelledAt,
      eventType: "CANCEL",
      studentId: tx.studentId || null,
      transactionId: tx.id,
      reason: why,
      actorRole: actor?.role || "admin",
      actorUserId: actor?.userId || null,
      payloadSnapshot: {
        transactionKind: tx.transactionKind || null,
        amountTaxInclusive: Number(tx.amountTaxInclusive || 0),
      },
    });

    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "payment.transaction_soft_cancelled",
      targetType: "payment_transaction",
      targetId: tx.id,
      summary: `Payment transaction soft-cancelled ${tx.id}`,
      meta: { reason: why, studentId: tx.studentId || null },
    });

    await writeStore(store);
    return { transaction: tx, alreadyCancelled: false };
  });
}

/** 学生ポータル「決済履歴」上部サマリー（保存済みのみ・再計算なし） */
export async function getStudentPaymentPortalSummary(userId) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    migrateStudentShape(student);
    const txs = store.paymentTransactions
      .filter((t) => t.studentId === student.id && t.status === "completed")
      .sort((a, b) => String(b.paidAt || "").localeCompare(String(a.paidAt || "")));
    const last = txs[0] || null;
    const remaining = Number(student.lessonMinutes?.remainingMinutes || 0);
    return {
      studentId: student.id,
      pointsBalance: Number(student.points?.balance || 0),
      remainingMinutes: remaining,
      /** 予約に使える残りレッスン時間（分）＝現在の残り時間 */
      reservableMinutes: remaining,
      lastPaymentPaidAt: last ? last.paidAt : null,
    };
  });
}

/**
 * 管理画面「決済詳細」用: メール完了ログ・登録者表示・学生の現在値（参照のみ）
 */
export async function getPaymentTransactionAdminExtras(transactionId) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const tid = String(transactionId || "").trim();
    const tx = store.paymentTransactions.find((t) => t.id === tid) || null;
    if (!tx) return null;
    const st = store.students.find((s) => s.id === tx.studentId) || null;
    if (st) migrateStudentShape(st);
    const logs = [...(store.paymentCompletionLogs || [])].filter((l) => l.transactionId === tid);
    logs.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const completionLog = logs[0] || null;
    let registeredByLabel = "—";
    if (tx.registeredByUserId) {
      const u = store.users.find((x) => x.id === tx.registeredByUserId);
      if (u) registeredByLabel = String(u.email || u.name || u.id || "").trim() || "—";
    }
    return {
      studentCurrent: st
        ? {
            pointsBalance: Number(st.points?.balance || 0),
            remainingMinutes: Number(st.lessonMinutes?.remainingMinutes || 0),
          }
        : null,
      completionLog,
      registeredByLabel,
    };
  });
}

export async function listPaymentTransactionsForStudent(userId) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const student = findLinkedStudent(store, userId);
    if (!student) return [];
    return store.paymentTransactions
      .filter((t) => t.studentId === student.id && t.status === "completed")
      .sort((a, b) => String(b.paidAt || "").localeCompare(String(a.paidAt || "")));
  });
}

function formatLessonMinuteLogForStudentPortal(log) {
  const t = String(log.type || "");
  const m = Math.abs(Number(log.minutes || 0));
  if (t === "deduction") return `レッスンで${m}分 使用しました`;
  if (t === "refund") return "キャンセルにより時間を復元しました";
  if (t.startsWith("credit_")) return `レッスン時間が${m}分 追加されました`;
  if (t === "manual_adjustment") return "レッスン時間を調整しました";
  return "時間の記録を更新しました";
}

/** 学生ホーム用：内部理由・管理者情報は出さない */
export async function listLessonMinuteLogsForStudentPortal(userId, limit = 5) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return [];
    const max = Math.min(20, Math.max(1, Number(limit) || 5));
    return [...store.lessonMinuteLogs]
      .filter((l) => l.studentId === student.id)
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
      .slice(0, max)
      .map((log) => ({
        id: log.id,
        at: log.at,
        minutes: Number(log.minutes || 0),
        summary: formatLessonMinuteLogForStudentPortal(log),
      }));
  });
}

/**
 * 学生「レッスン時間・履歴」画面用（原簿ベース・次回予約目安つき）
 */
export async function getStudentLessonMinutesUsageForPortal(userId) {
  return enqueue(async () => {
    const store = await readStore();
    const student = findLinkedStudent(store, userId);
    if (!student) return null;
    migrateStudentShape(student);
    applyLessonMinutesFromJournal(store, student);
    const rem = Math.max(0, Number(student.lessonMinutes?.remainingMinutes || 0));

    const upcoming = store.reservations
      .filter(
        (r) =>
          r.studentId === student.id && ["requested", "confirmed"].includes(String(r.status || "").trim())
      )
      .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`));
    const nextReservation = upcoming[0]
      ? {
          id: upcoming[0].id,
          status: upcoming[0].status,
          date: upcoming[0].date || "",
          time: upcoming[0].time || "",
          durationMinutes: upcoming[0].durationMinutes || 0,
        }
      : null;

    const completionPreview = buildLessonMinutesCompletionPreview({
      remainingMinutes: rem,
      nextReservation,
    });

    let minutesAttention = "ok";
    if (rem <= 0) minutesAttention = "exhausted";
    else if (rem <= 180) minutesAttention = "low";
    else if (completionPreview.nextCompletionInsufficient) minutesAttention = "next_short";

    const reservationHintById = {};
    for (const r of store.reservations) {
      if (r.studentId !== student.id || !r.id) continue;
      const d = String(r.date || "").trim();
      const t = String(r.time || "").trim();
      reservationHintById[r.id] = d && t ? `${d} ${t}` : d || t || String(r.id).slice(0, 8);
    }

    const journal = journalEntriesForStudent(store, student.id)
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const mapRow = (e) => formatLessonMinuteJournalEntryForStudentPortal(e, reservationHintById);
    const recentCharges = journal
      .filter((e) => String(e.type) === "charge")
      .slice(0, 25)
      .map(mapRow)
      .filter(Boolean);
    const recentUsage = journal
      .filter((e) => String(e.type) === "usage")
      .slice(0, 25)
      .map(mapRow)
      .filter(Boolean);

    const allStudentReservations = store.reservations.filter((r) => r.studentId === student.id);
    const reservedMinutesSum = sumReservedMinutesFromReservations(allStudentReservations);
    const completedTx = store.paymentTransactions.filter(
      (t) => t.studentId === student.id && String(t.status || "").trim() === "completed"
    );
    const totalPointsFromCompletedPayments = completedTx.reduce(
      (s, t) => s + Math.max(0, Number(t.finalPoints || 0)),
      0
    );

    return {
      lessonMinutes: {
        totalMinutes: Number(student.lessonMinutes?.totalMinutes || 0),
        usedMinutes: Number(student.lessonMinutes?.usedMinutes || 0),
        remainingMinutes: rem,
        updatedAt: student.lessonMinutes?.updatedAt || null,
      },
      completionPreview,
      minutesAttention,
      nextReservation,
      recentCharges,
      recentUsage,
      reservedMinutesSum,
      points: {
        balance: Math.max(0, Number(student.points?.balance || 0)),
        /** 完了決済の finalPoints 合算（返金・調整を含む履歴ベースの近似） */
        totalFromCompletedPayments: totalPointsFromCompletedPayments,
      },
    };
  });
}

export async function getPaymentSettingsForAdmin() {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    return {
      global: store.paymentGlobalRule,
      templates: store.paymentRuleTemplates,
      assignments: store.paymentStudentAssignments,
      history: [...store.paymentRuleHistory]
        .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
        .slice(0, 200),
      pointConversionRules: store.pointConversionRules.map((r) => ({
        id: r.id,
        yenAmount: r.yenAmount,
        points: r.points,
        isActive: r.isActive,
      })),
      pointTimeConversionRules: store.pointTimeConversionRules.map((r) => ({
        id: r.id,
        pointAmount: r.pointAmount,
        minutes: r.minutes,
        isActive: r.isActive,
      })),
    };
  });
}

export async function updatePaymentGlobalRuleByAdmin(patch = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const prev = JSON.stringify(store.paymentGlobalRule);
    if (patch.taxRatePercent !== undefined) {
      store.paymentGlobalRule.taxRatePercent = Math.max(0, Math.min(30, Number(patch.taxRatePercent)));
    }
    if (patch.bonusTiers !== undefined) {
      store.paymentGlobalRule.bonusTiers = Array.isArray(patch.bonusTiers) ? patch.bonusTiers : [];
    }
    store.paymentGlobalRule.updatedAt = nowIso();
    store.paymentRuleHistory.push({
      id: newId(),
      changeKind: "basic",
      targetLabel: "全体",
      beforeSummary: prev.slice(0, 800),
      afterSummary: JSON.stringify(store.paymentGlobalRule).slice(0, 800),
      actorUserId: actor?.userId || null,
      at: nowIso(),
      memo: String(patch?.memo || "").trim() || null,
    });
    writeAuditLog(store, {
      actorUserId: actor?.userId || null,
      actorRole: actor?.role || "admin",
      action: "payment.global_rule_updated",
      targetType: "payment_settings",
      targetId: "global",
      summary: "Updated payment global rule",
      meta: {},
    });
    await writeStore(store);
    return store.paymentGlobalRule;
  });
}

export async function upsertPaymentRuleTemplateByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const id = String(payload?.id || "").trim() || newId();
    const existing = store.paymentRuleTemplates.find((t) => t.id === id);
    const row = {
      id,
      name: String(payload?.name || existing?.name || "ルール").trim(),
      baseYenAmount: Math.max(1, Number(payload?.baseYenAmount ?? existing?.baseYenAmount ?? 1)),
      basePoints: Math.max(1, Number(payload?.basePoints ?? existing?.basePoints ?? 1)),
      bonusTiers: Array.isArray(payload?.bonusTiers) ? payload.bonusTiers : existing?.bonusTiers || [],
      timePointAmount: Math.max(1, Number(payload?.timePointAmount ?? existing?.timePointAmount ?? 1)),
      timeMinutes: Math.max(1, Number(payload?.timeMinutes ?? existing?.timeMinutes ?? 1)),
      updatedAt: nowIso(),
      createdAt: existing?.createdAt || nowIso(),
    };
    if (existing) {
      Object.assign(existing, row);
    } else {
      store.paymentRuleTemplates.push(row);
    }
    store.paymentRuleHistory.push({
      id: newId(),
      changeKind: "template",
      targetLabel: row.name,
      beforeSummary: existing ? JSON.stringify(existing).slice(0, 600) : "",
      afterSummary: JSON.stringify(row).slice(0, 600),
      actorUserId: actor?.userId || null,
      at: nowIso(),
      memo: String(payload?.memo || "").trim() || null,
    });
    await writeStore(store);
    return row;
  });
}

export async function setStudentPaymentAssignmentByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const studentId = String(payload?.studentId || "").trim();
    const kind = String(payload?.kind || "").trim() === "individual" ? "individual" : "bulk";
    const templateId = String(payload?.templateId || "").trim();
    const effectiveFrom = String(payload?.effectiveFrom || "").trim() || nowIso();
    const memo = String(payload?.memo || "").trim();
    if (!studentId) throw new Error("学生が指定されていません。");
    if (!templateId) throw new Error("ルールテンプレートを指定してください。");
    const tpl = store.paymentRuleTemplates.find((t) => t.id === templateId);
    if (!tpl) throw new Error("テンプレートが見つかりません。");

    store.paymentStudentAssignments.forEach((a) => {
      if (a.studentId === studentId && a.kind === kind && !a.effectiveTo) {
        a.effectiveTo = effectiveFrom;
      }
    });
    const row = {
      id: newId(),
      studentId,
      kind,
      templateId,
      effectiveFrom,
      effectiveTo: null,
      memo,
      createdAt: nowIso(),
      createdByUserId: actor?.userId || null,
    };
    store.paymentStudentAssignments.push(row);
    store.paymentRuleHistory.push({
      id: newId(),
      changeKind: kind,
      targetLabel: `${kind}:${studentId}`,
      beforeSummary: "",
      afterSummary: JSON.stringify(row).slice(0, 600),
      actorUserId: actor?.userId || null,
      at: nowIso(),
      memo,
    });
    await writeStore(store);
    return row;
  });
}

export async function bulkSetPaymentAssignmentsByAdmin(payload = {}, actor = null) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const studentIds = Array.isArray(payload?.studentIds) ? payload.studentIds : [];
    const templateId = String(payload?.templateId || "").trim();
    const effectiveFrom = String(payload?.effectiveFrom || "").trim() || nowIso();
    const memo = String(payload?.memo || "").trim();
    if (!templateId) throw new Error("ルールテンプレートを指定してください。");
    const tpl = store.paymentRuleTemplates.find((t) => t.id === templateId);
    if (!tpl) throw new Error("テンプレートが見つかりません。");
    const results = [];
    for (const studentId of studentIds) {
      const sid = String(studentId || "").trim();
      if (!sid) continue;
      const ind = store.paymentStudentAssignments.some(
        (a) => a.studentId === sid && a.kind === "individual" && !a.effectiveTo
      );
      if (ind) {
        results.push({ studentId: sid, skipped: true, reason: "individual_rule_exists" });
        continue;
      }
      store.paymentStudentAssignments.forEach((a) => {
        if (a.studentId === sid && a.kind === "bulk" && !a.effectiveTo) {
          a.effectiveTo = effectiveFrom;
        }
      });
      const row = {
        id: newId(),
        studentId: sid,
        kind: "bulk",
        templateId,
        effectiveFrom,
        effectiveTo: null,
        memo,
        createdAt: nowIso(),
        createdByUserId: actor?.userId || null,
      };
      store.paymentStudentAssignments.push(row);
      store.paymentRuleHistory.push({
        id: newId(),
        changeKind: "bulk",
        targetLabel: `bulk:${sid}`,
        beforeSummary: "",
        afterSummary: JSON.stringify(row).slice(0, 600),
        actorUserId: actor?.userId || null,
        at: nowIso(),
        memo,
      });
      results.push({ studentId: sid, skipped: false });
    }
    await writeStore(store);
    return { results, template: tpl };
  });
}

export async function getPaymentStudentDetailForAdmin(studentId) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const sid = String(studentId || "").trim();
    const transactions = [...store.paymentTransactions]
      .filter((t) => t.studentId === sid)
      .sort((a, b) => String(b.paidAt || "").localeCompare(String(a.paidAt || "")))
      .slice(0, 80);
    const assignments = [...store.paymentStudentAssignments]
      .filter((a) => a.studentId === sid)
      .sort((a, b) => String(b.effectiveFrom || "").localeCompare(String(a.effectiveFrom || "")));
    const resolved = resolvePaymentRuleForStudent(store, sid, nowIso());
    const assignmentHistory = assignments.map((a) => ({
      ...a,
      templateName: store.paymentRuleTemplates.find((t) => t.id === a.templateId)?.name || a.templateId,
      kindLabel: a.kind === "individual" ? "個別" : "一括",
    }));
    return {
      currentLayer: resolved.layer,
      currentRuleLabel: paymentRuleLabel(resolved.layer),
      currentTemplateId: resolved.templateId,
      transactions,
      assignmentHistory,
      templates: store.paymentRuleTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        baseYenAmount: t.baseYenAmount,
        basePoints: t.basePoints,
      })),
    };
  });
}

export async function getSalesDashboardForAdmin(filters = {}) {
  return enqueue(async () => {
    const store = await readStore();
    ensurePaymentModule(store);
    const { fromAt, toAt } = toDateRange(filters?.fromDate, filters?.toDate);
    let txs = store.paymentTransactions.filter((t) => t.status === "completed");
    if (fromAt) txs = txs.filter((t) => String(t.paidAt || "") >= fromAt);
    if (toAt) txs = txs.filter((t) => String(t.paidAt || "") <= toAt);

    const sum = {
      count: txs.length,
      amountTaxExclusive: 0,
      taxAmount: 0,
      amountTaxInclusive: 0,
      totalPoints: 0,
      totalMinutes: 0,
      manualGrantCount: 0,
    };
    const byMethod = {};
    const byStudent = {};
    for (const t of txs) {
      sum.amountTaxExclusive += Number(t.amountTaxExclusive || 0);
      sum.taxAmount += Number(t.taxAmount || 0);
      sum.amountTaxInclusive += Number(t.amountTaxInclusive || 0);
      sum.totalPoints += Number(t.finalPoints || 0);
      sum.totalMinutes += Number(t.grantedMinutes || 0);
      if (t.transactionKind === "point_grant" || Number(t.manualPoints || 0) > 0) {
        sum.manualGrantCount += 1;
      }
      const pm = t.paymentMethod || "不明";
      byMethod[pm] = byMethod[pm] || { count: 0, amountTaxInclusive: 0 };
      byMethod[pm].count += 1;
      byMethod[pm].amountTaxInclusive += Number(t.amountTaxInclusive || 0);
      const sid = t.studentId;
      if (!byStudent[sid]) {
        byStudent[sid] = {
          studentId: sid,
          studentName: t.studentNameSnapshot,
          studentNumber: t.studentNumberSnapshot,
          count: 0,
          amountTaxInclusive: 0,
          points: 0,
          lastPaidAt: t.paidAt,
        };
      }
      byStudent[sid].count += 1;
      byStudent[sid].amountTaxInclusive += Number(t.amountTaxInclusive || 0);
      byStudent[sid].points += Number(t.finalPoints || 0);
      if (String(t.paidAt || "") > String(byStudent[sid].lastPaidAt || "")) {
        byStudent[sid].lastPaidAt = t.paidAt;
      }
    }
    const studentRows = Object.values(byStudent).sort((a, b) => b.amountTaxInclusive - a.amountTaxInclusive);
    const MAX_TX = 120;
    return { sum, byMethod, studentRows, transactions: txs.slice(0, MAX_TX), transactionsTotal: txs.length };
  });
}

const RISK_KEYWORDS = ["発音", "助詞", "語尾", "文法", "会話", "復習", "宿題"];

/**
 * @param {object} store
 * @param {string} sid
 * @returns {Array<{ id: string, label: string, tone: string }>}
 */
function buildRiskBadgesForStudent(store, sid) {
  const todayYmd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
  const todayMs = Date.parse(`${todayYmd}T12:00:00`);
  const cutoff30 = new Date(todayMs - 30 * 86400000);
  const badges = [];
  const studentRow = store.students.find((s) => String(s.id) === sid);

  const reservations = store.reservations
    .filter((r) => String(r.studentId) === sid && String(r.status || "") !== "cancelled")
    .sort((a, b) => `${b.date || ""} ${b.time || ""}`.localeCompare(`${a.date || ""} ${a.time || ""}`));
  const last = reservations[0];
  const lastYmd = last?.date ? String(last.date).slice(0, 10) : "";
  if (lastYmd) {
    const lastMs = Date.parse(`${lastYmd}T12:00:00`);
    const diffDays = Math.floor((todayMs - lastMs) / 86400000);
    if (diffDays > 60) badges.push({ id: "gap_long", label: "予約空き長め", tone: "warn" });
  } else {
    badges.push({ id: "no_res_hist", label: "予約履歴弱い", tone: "info" });
  }

  const hws = store.homeworks.filter((h) => String(h.studentId) === sid);
  const pend = hws.filter((h) => !["reviewed", "completed"].includes(String(h.status || "")));
  if (pend.length >= 3) badges.push({ id: "hw_backlog", label: `宿題${pend.length}件`, tone: "danger" });

  const noteIds = new Set(
    store.lessonNoteStudents.filter((l) => String(l.studentId) === sid).map((l) => l.lessonNoteId)
  );
  const notes = store.lessonNotes.filter((n) => noteIds.has(n.id));
  const recentNotes = notes.filter((n) => {
    const d = String(n.date || n.updatedAt || "").slice(0, 10);
    if (!d) return false;
    return Date.parse(`${d}T12:00:00`) >= cutoff30.getTime();
  });
  if (notes.length > 0 && recentNotes.length === 0) {
    badges.push({ id: "note_stale", label: "ノート30日なし", tone: "warn" });
  } else if (notes.length === 0) {
    badges.push({ id: "no_note", label: "ノートなし", tone: "info" });
  }

  const texts = [];
  notes.slice(0, 12).forEach((n) => {
    texts.push(String(n.summary || ""), String(n.content || ""), String(n.title || ""));
  });
  const kwHits = {};
  RISK_KEYWORDS.forEach((k) => {
    kwHits[k] = 0;
  });
  texts.forEach((text) => {
    RISK_KEYWORDS.forEach((k) => {
      if (text.includes(k)) kwHits[k] += 1;
    });
  });
  const repeatKw = Object.entries(kwHits).filter(([, c]) => c >= 2).length;
  if (repeatKw >= 2) badges.push({ id: "kw_repeat", label: "注意語繰返し", tone: "info" });

  if (studentRow) {
    migrateStudentShape(studentRow);
    applyLessonMinutesFromJournal(store, studentRow);
    const rem = Number(studentRow.lessonMinutes?.remainingMinutes || 0);
    if (rem <= 0) {
      badges.push({ id: "minutes_exhausted", label: "残り時間0以下", tone: "danger" });
    } else if (rem <= 180) {
      badges.push({ id: "minutes_low", label: "残り時間少なめ(180分以下)", tone: "warn" });
    }
    const upcoming = store.reservations
      .filter(
        (r) =>
          String(r.studentId) === sid && ["requested", "confirmed"].includes(String(r.status || "").trim())
      )
      .sort((a, b) => `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`));
    const nextRes = upcoming[0];
    if (nextRes) {
      const need = Math.max(0, Number(nextRes.durationMinutes || 0));
      if (need > 0 && rem < need) {
        badges.push({ id: "minutes_will_run_out", label: "次回予約で時間不足の恐れ", tone: "warn" });
      }
    }
  }

  if (studentRow && String(studentRow.registrationStatus || "") === "completed") {
    const createdRaw = String(studentRow.createdAt || studentRow.updatedAt || "").trim();
    const createdDay = createdRaw.length >= 10 ? createdRaw.slice(0, 10) : "";
    const createdMs = createdDay ? Date.parse(`${createdDay}T12:00:00`) : NaN;
    const daysSinceReg = Number.isFinite(createdMs) ? Math.floor((todayMs - createdMs) / 86400000) : 0;
    const hasAnyReservation = reservations.length > 0;
    if (daysSinceReg >= 14 && !hasAnyReservation && notes.length === 0 && hws.length === 0) {
      badges.push({ id: "post_reg_idle", label: "登録後の活動薄め", tone: "info" });
    }
  }

  const minuteOrder = { minutes_exhausted: 0, minutes_low: 1, minutes_will_run_out: 2 };
  const toneOrder = { danger: 0, warn: 1, info: 2 };
  badges.sort((a, b) => {
    const ma = minuteOrder[a.id];
    const mb = minuteOrder[b.id];
    if (ma !== undefined || mb !== undefined) {
      const sa = ma !== undefined ? ma : 99;
      const sb = mb !== undefined ? mb : 99;
      if (sa !== sb) return sa - sb;
    }
    const ta = toneOrder[a.tone] ?? 9;
    const tb = toneOrder[b.tone] ?? 9;
    if (ta !== tb) return ta - tb;
    return 0;
  });
  return badges.slice(0, 6);
}

/**
 * 管理画面用・学生IDごとの簡易リスクバッジ（読み取り専用表示向け）
 * @param {string[]} studentIds
 * @returns {Promise<Record<string, Array<{ id: string, label: string, tone: string }>>>}
 */
export async function summarizeStudentRisksForAdmin(studentIds = []) {
  return enqueue(async () => {
    const store = await readStore();
    const ids = [...new Set(studentIds.map((x) => String(x || "").trim()).filter(Boolean))].slice(0, 120);
    const out = {};

    for (const sid of ids) {
      out[sid] = buildRiskBadgesForStudent(store, sid);
    }
    return out;
  });
}

const RISK_TONE_ORDER = { danger: 0, warn: 1, info: 2 };

/**
 * リスクバッジが1つ以上付く学生のみ（読み取り専用の一覧用・既存 buildRiskBadges ロジックをそのまま利用）
 */
export async function listAtRiskStudentsForAdmin(options = {}) {
  return enqueue(async () => {
    const store = await readStore();
    const limit = Math.max(1, Math.min(400, Number(options.limit || 250)));
    const rows = store.students.map((student) => {
      migrateStudentShape(student);
      applyLessonMinutesFromJournal(store, student);
      const link = store.userStudentLinks.find((item) => item.studentId === student.id);
      const user = link ? store.users.find((item) => item.id === link.userId) : null;
      return toStudentDto(student, user, resolvePairInfoForStudent(store, student.id));
    });
    const withBadges = [];
    for (const row of rows) {
      const riskBadges = buildRiskBadgesForStudent(store, row.id);
      if (riskBadges.length === 0) continue;
      withBadges.push({ ...row, riskBadges });
    }
    withBadges.sort((a, b) => {
      const ta = Math.min(...a.riskBadges.map((x) => RISK_TONE_ORDER[x.tone] ?? 9));
      const tb = Math.min(...b.riskBadges.map((x) => RISK_TONE_ORDER[x.tone] ?? 9));
      if (ta !== tb) return ta - tb;
      return String(a.nameKanji || "").localeCompare(String(b.nameKanji || ""), "ja");
    });
    return {
      items: withBadges.slice(0, limit),
      total: withBadges.length,
      truncated: withBadges.length > limit,
    };
  });
}

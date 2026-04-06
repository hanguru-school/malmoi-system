import nodemailer from "nodemailer";
import { getMailRuntimePolicy, isMailTemplateEnabled, recordMailLog } from "./store";
import {
  classroomContactFooterText,
  classroomDisplayName,
  formatYen,
  jpAppliedRuleType,
  jpTransactionKind,
  officeInboxEmail,
} from "../payments/receipt-labels.js";

const SERVICE_NAME = "MalMoi 韓国語教室";
const PORTAL_URL = "https://portal.hanguru.school";

function mailMode(policyMode = null) {
  const explicit = String(process.env.MAIL_SEND_MODE || "").trim().toLowerCase();
  if (explicit === "smtp" || explicit === "log" || explicit === "disabled") return explicit;
  const settingMode = String(policyMode || "").trim().toLowerCase();
  if (settingMode === "smtp" || settingMode === "log" || settingMode === "disabled") return settingMode;
  return process.env.NODE_ENV === "production" ? "smtp" : "log";
}

function smtpConfigFromEnv() {
  return {
    host: String(process.env.SMTP_HOST || "").trim(),
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    user: String(process.env.SMTP_USER || "").trim(),
    pass: String(process.env.SMTP_PASS || "").trim(),
    from: String(process.env.MAIL_FROM || "").trim(),
  };
}

function validateSmtpConfig(config) {
  if (!config.host || !config.port || !config.from) {
    throw new Error("SMTP_HOST/SMTP_PORT/MAIL_FROM must be configured for smtp mode.");
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatExpiresAt(expiresAt) {
  if (!expiresAt) return "未設定";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return String(expiresAt);
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

function displayValue(value, fallback = "未設定") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function buildStudentMailTemplate({
  subject,
  headline,
  introLines,
  actionLabel,
  actionUrl,
  expiresAt,
  subLines = [],
  detailItems = [],
}) {
  const safeUrl = String(actionUrl || PORTAL_URL);
  const safeHeadline = escapeHtml(headline);
  const expiresLabel = expiresAt ? escapeHtml(formatExpiresAt(expiresAt)) : null;
  const introHtml = introLines.map((line) => `<p style="margin:0 0 10px;">${escapeHtml(line)}</p>`).join("");
  const subHtml = subLines.map((line) => `<p style="margin:0 0 6px;">${escapeHtml(line)}</p>`).join("");
  const detailHtml =
    detailItems.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 2px;border:1px solid #e2e8f0;border-radius:10px;">
          ${detailItems
            .map(
              (item) =>
                `<tr>
                  <td style="padding:8px 10px;width:40%;font-size:13px;color:#64748b;border-bottom:1px solid #eef2f7;">${escapeHtml(
                    item.label,
                  )}</td>
                  <td style="padding:8px 10px;font-size:13px;color:#334155;border-bottom:1px solid #eef2f7;">${escapeHtml(
                    displayValue(item.value),
                  )}</td>
                </tr>`,
            )
            .join("")}
        </table>`
      : "";

  const text = [
    `${SERVICE_NAME} からのお知らせ`,
    "",
    headline,
    "",
    ...introLines,
    "",
    `手続きはこちら: ${safeUrl}`,
    ...(expiresAt ? [`有効期限: ${formatExpiresAt(expiresAt)}`] : []),
    "",
    ...detailItems.map((item) => `${item.label}: ${displayValue(item.value)}`),
    ...(detailItems.length ? [""] : []),
    ...subLines,
    "",
    "──────────────",
    `${SERVICE_NAME}`,
    "韓国語学習ポータル",
    PORTAL_URL,
    "このメールは自動送信されています。",
    "返信には対応していません。",
    "──────────────",
  ].join("\n");

  const html = `
<div style="margin:0;padding:24px 12px;background:#f3f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans JP',sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe6f0;border-radius:14px;">
    <tr>
      <td style="padding:20px 20px 6px;text-align:center;">
        <p style="margin:0;font-size:13px;letter-spacing:0.08em;color:#64748b;">${escapeHtml(SERVICE_NAME)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:4px 20px 0;">
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.35;text-align:center;color:#0f172a;">${safeHeadline}</h1>
        <div style="font-size:15px;line-height:1.7;color:#334155;">${introHtml}</div>
        ${detailHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:10px 20px 0;text-align:center;">
        <a href="${escapeHtml(safeUrl)}" style="display:inline-block;min-width:230px;padding:12px 18px;border-radius:10px;background:#2f6df6;color:#ffffff;text-decoration:none;font-weight:700;">
          ${escapeHtml(actionLabel)}
        </a>
      </td>
    </tr>
    ${
      expiresLabel
        ? `<tr>
      <td style="padding:14px 20px 0;">
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
          このリンクの有効期限: <strong>${expiresLabel}</strong>
        </p>
        <p style="margin:10px 0 0;font-size:12px;color:#64748b;word-break:break-all;">
          ボタンが開けない場合: <a href="${escapeHtml(safeUrl)}" style="color:#2f6df6;">${escapeHtml(
            safeUrl,
          )}</a>
        </p>
      </td>
    </tr>`
        : ""
    }
    <tr>
      <td style="padding:14px 20px 0;font-size:13px;line-height:1.65;color:#475569;">
        ${subHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px 20px;border-top:1px solid #edf2f7;font-size:12px;line-height:1.6;color:#94a3b8;">
        <p style="margin:0 0 2px;">──────────────</p>
        <p style="margin:0;">${escapeHtml(SERVICE_NAME)}</p>
        <p style="margin:2px 0 0;">韓国語学習ポータル: <a href="${PORTAL_URL}" style="color:#64748b;">${PORTAL_URL}</a></p>
        <p style="margin:6px 0 0;">このメールは自動送信されています。</p>
        <p style="margin:2px 0 0;">返信には対応していません。</p>
        <p style="margin:2px 0 0;">──────────────</p>
      </td>
    </tr>
  </table>
</div>
`.trim();

  return { subject, text, html };
}

function buildLoginMail({ loginUrl, expiresAt }) {
  return buildStudentMailTemplate({
    subject: `【MalMoi韓国語教室】ログインリンクのお知らせ`,
    headline: "ログイン手続きを続けてください",
    introLines: [
      "MalMoi 韓国語教室へのログインリンクをお送りしました。",
      "以下のボタンをクリックしてログインを続けてください。",
    ],
    actionLabel: "ログインを続ける",
    actionUrl: loginUrl,
    expiresAt,
    subLines: [
      "このリンクは一定時間のみ有効です。",
      "心当たりがない場合は、このメールを破棄してください。",
    ],
  });
}

function buildRegistrationMail({ loginUrl, expiresAt }) {
  return buildStudentMailTemplate({
    subject: `【MalMoi韓国語教室】登録を続けてください`,
    headline: "登録手続きを続けてください",
    introLines: [
      "MalMoi 韓国語教室への登録を開始しました。",
      "続きの登録を行うには、下のボタンを押してください。",
    ],
    actionLabel: "登録を続ける",
    actionUrl: loginUrl,
    expiresAt,
    subLines: [
      "このリンクは一定時間のみ有効です。",
      "メールに心当たりがない場合は、このメールを無視してください。",
    ],
  });
}

function buildRoleInviteMail({ inviteUrl, expiresAt, roleLabel }) {
  return buildStudentMailTemplate({
    subject: `【MalMoi韓国語教室】アカウント招待`,
    headline: `${roleLabel}アカウントの登録`,
    introLines: [
      "教室からアカウント登録の招待が届きました。",
      "下のボタンからパスワード設定とプロフィール入力を完了してください。",
    ],
    actionLabel: "招待を受けて登録する",
    actionUrl: inviteUrl,
    expiresAt,
    subLines: [
      "この招待は役割が固定されています。心当たりがない場合は破棄してください。",
    ],
  });
}

export async function sendRoleInviteMail({ toEmail, inviteUrl, expiresAt, role }) {
  const roleLabel = String(role || "") === "parent" ? "保護者" : "講師";
  const payload = buildRoleInviteMail({ inviteUrl, expiresAt, roleLabel });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "role invite",
    linkForLog: inviteUrl,
    mailType: "auth_login_link",
    templateName: "role_invite_mail",
    meta: { purpose: "role_invitation", recipientRole: role || "teacher" },
  });
}

function buildPasswordResetMail({ resetUrl, expiresAt }) {
  return buildStudentMailTemplate({
    subject: `【MalMoi韓国語教室】パスワード再設定のご案内`,
    headline: "パスワード再設定を続けてください",
    introLines: [
      "パスワード再設定のリクエストを受け付けました。",
      "以下のボタンをクリックして、再設定手続きを続けてください。",
    ],
    actionLabel: "再設定手続きへ進む",
    actionUrl: resetUrl,
    expiresAt,
    subLines: [
      "このリンクは一定時間のみ有効です。",
      "心当たりがない場合は、このメールを破棄してください。",
    ],
  });
}

function buildReservationConfirmedMail({ lessonDate, teacher, lessonType, portalUrl }) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】レッスン予約が完了しました",
    headline: "レッスン予約が完了しました",
    introLines: [
      "以下の内容でレッスンを受け付けました。",
      "予約内容の確認や変更はポータルから行うことができます。",
    ],
    detailItems: [
      { label: "レッスン日時", value: lessonDate },
      { label: "担当講師", value: teacher },
      { label: "レッスン形式", value: lessonType },
    ],
    actionLabel: "ポータルを開く",
    actionUrl: portalUrl || PORTAL_URL,
    subLines: [],
  });
}

function buildReservationUpdatedMail({ lessonDate, teacher, lessonType, portalUrl }) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】レッスン予約が変更されました",
    headline: "レッスン予約が変更されました",
    introLines: ["新しいレッスン内容はこちらです。", "内容をご確認ください。"],
    detailItems: [
      { label: "レッスン日時", value: lessonDate },
      { label: "担当講師", value: teacher },
      { label: "レッスン形式", value: lessonType },
    ],
    actionLabel: "ポータルを開く",
    actionUrl: portalUrl || PORTAL_URL,
    subLines: [],
  });
}

function buildLessonReminderMail({ lessonDate, teacher, lessonType, portalUrl }) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】本日のレッスンのお知らせ",
    headline: "本日のレッスンのお知らせです",
    introLines: ["時間になりましたら、ポータルからレッスンをご確認ください。"],
    detailItems: [
      { label: "レッスン日時", value: lessonDate },
      { label: "担当講師", value: teacher },
      { label: "レッスン形式", value: lessonType },
    ],
    actionLabel: "ポータルを開く",
    actionUrl: portalUrl || PORTAL_URL,
    subLines: [],
  });
}

function buildLessonNoteStudentMail({
  lessonDate,
  teacherName,
  lessonTopic,
  reviewPoint,
  homework,
  noteUrl,
}) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】今日のレッスンノート",
    headline: "レッスンノートをお届けします",
    introLines: [
      "本日のレッスン内容をまとめました。",
      "ポータルからレッスンノートをご確認ください。",
    ],
    detailItems: [
      { label: "レッスン日", value: lessonDate },
      { label: "担当講師", value: teacherName },
      { label: "今日の学習テーマ", value: lessonTopic },
      { label: "復習ポイント", value: reviewPoint },
      { label: "宿題", value: homework },
    ],
    actionLabel: "レッスンノートを見る",
    actionUrl: noteUrl || PORTAL_URL,
    subLines: [],
  });
}

function buildLessonNoteParentMail({
  lessonDate,
  teacherName,
  lessonTopic,
  reviewPoint,
  homework,
  noteUrl,
}) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】お子様のレッスンノート",
    headline: "お子様のレッスンノートをお届けします",
    introLines: ["本日のレッスン内容をポータルからご確認ください。"],
    detailItems: [
      { label: "レッスン日", value: lessonDate },
      { label: "担当講師", value: teacherName },
      { label: "学習内容", value: lessonTopic },
      { label: "復習ポイント", value: reviewPoint },
      { label: "宿題", value: homework },
    ],
    actionLabel: "レッスンノートを見る",
    actionUrl: noteUrl || PORTAL_URL,
    subLines: ["詳しい内容はポータルからご確認ください。"],
  });
}

function buildHomeworkAssignedStudentMail({
  homeworkTitle,
  lessonDate,
  homeworkType,
  teacherName,
  homeworkUrl,
}) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】新しい宿題があります",
    headline: "新しい宿題があります",
    introLines: ["ポータルから内容をご確認ください。"],
    detailItems: [
      { label: "宿題タイトル", value: homeworkTitle },
      { label: "関連レッスン日", value: lessonDate },
      { label: "種類", value: homeworkType },
      { label: "担当講師", value: teacherName },
    ],
    actionLabel: "宿題を見る",
    actionUrl: homeworkUrl || PORTAL_URL,
    subLines: [],
  });
}

function buildHomeworkAssignedParentMail({
  studentName,
  homeworkTitle,
  lessonDate,
  homeworkType,
  teacherName,
  homeworkUrl,
}) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】お子様の新しい宿題のお知らせ",
    headline: "お子様の宿題が追加されました",
    introLines: ["ポータルから内容をご確認ください。"],
    detailItems: [
      { label: "お子様", value: studentName },
      { label: "宿題タイトル", value: homeworkTitle },
      { label: "関連レッスン日", value: lessonDate },
      { label: "種類", value: homeworkType },
      { label: "担当講師", value: teacherName },
    ],
    actionLabel: "宿題を見る",
    actionUrl: homeworkUrl || PORTAL_URL,
    subLines: [],
  });
}

function buildNoticePublishedMail({ noticeTitle, noticeSummary, noticeUrl }) {
  return buildStudentMailTemplate({
    subject: "【MalMoi韓国語教室】お知らせ",
    headline: "新しいお知らせがあります",
    introLines: ["ポータルでご確認ください。"],
    detailItems: [
      { label: "タイトル", value: noticeTitle },
      { label: "概要", value: noticeSummary },
    ],
    actionLabel: "お知らせを見る",
    actionUrl: noticeUrl || PORTAL_URL,
    subLines: [],
  });
}

function previewText(text, max = 1200) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function previewHtml(html, max = 2000) {
  const normalized = String(html || "").trim();
  if (!normalized) return null;
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

async function deliverMail({ toEmail, payload, logLabel, linkForLog, mailType, templateName = null, meta = {}, attachments = null }) {
  const runtime = await getMailRuntimePolicy();
  const mode = mailMode(runtime?.sendMode || null);
  const enabled = await isMailTemplateEnabled(mailType || "unknown");
  if (!enabled) {
    await recordMailLog({
      type: mailType || "unknown",
      templateName: templateName || mailType || "unknown",
      toEmail,
      recipientEmail: toEmail,
      recipientName: meta.recipientName || null,
      recipientRole: meta.recipientRole || null,
      subject: payload.subject,
      status: "disabled",
      mode,
      linkUrl: linkForLog || null,
      bodyPreviewText: previewText(payload.text),
      bodyPreviewHtml: previewHtml(payload.html),
      relatedStudentId: meta.relatedStudentId || null,
      relatedParentId: meta.relatedParentId || null,
      relatedReservationId: meta.relatedReservationId || null,
      relatedLessonNoteId: meta.relatedLessonNoteId || null,
      relatedNoticeId: meta.relatedNoticeId || null,
      meta,
    });
    return { attempted: false, sent: false, mode, messageId: null };
  }

  if (mode === "disabled") {
    await recordMailLog({
      type: mailType || "unknown",
      templateName: templateName || mailType || "unknown",
      toEmail,
      recipientEmail: toEmail,
      recipientName: meta.recipientName || null,
      recipientRole: meta.recipientRole || null,
      subject: payload.subject,
      status: "disabled",
      mode,
      linkUrl: linkForLog || null,
      bodyPreviewText: previewText(payload.text),
      bodyPreviewHtml: previewHtml(payload.html),
      relatedStudentId: meta.relatedStudentId || null,
      relatedParentId: meta.relatedParentId || null,
      relatedReservationId: meta.relatedReservationId || null,
      relatedLessonNoteId: meta.relatedLessonNoteId || null,
      relatedNoticeId: meta.relatedNoticeId || null,
      meta,
    });
    return { attempted: false, sent: false, mode, messageId: null };
  }

  if (mode === "log") {
    console.info(`[mail] ${logLabel} for ${toEmail}: ${linkForLog || "-"}`);
    await recordMailLog({
      type: mailType || "unknown",
      templateName: templateName || mailType || "unknown",
      toEmail,
      recipientEmail: toEmail,
      recipientName: meta.recipientName || null,
      recipientRole: meta.recipientRole || null,
      subject: payload.subject,
      status: "logged",
      mode,
      linkUrl: linkForLog || null,
      bodyPreviewText: previewText(payload.text),
      bodyPreviewHtml: previewHtml(payload.html),
      relatedStudentId: meta.relatedStudentId || null,
      relatedParentId: meta.relatedParentId || null,
      relatedReservationId: meta.relatedReservationId || null,
      relatedLessonNoteId: meta.relatedLessonNoteId || null,
      relatedNoticeId: meta.relatedNoticeId || null,
      meta,
    });
    return { attempted: false, sent: false, mode, messageId: null };
  }

  const config = smtpConfigFromEnv();
  validateSmtpConfig(config);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
  try {
    const attachList = Array.isArray(attachments) && attachments.length ? attachments : null;
    const result = await transporter.sendMail({
      from: config.from,
      to: toEmail,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      ...(attachList ? { attachments: attachList } : {}),
    });
    await recordMailLog({
      type: mailType || "unknown",
      templateName: templateName || mailType || "unknown",
      toEmail,
      recipientEmail: toEmail,
      recipientName: meta.recipientName || null,
      recipientRole: meta.recipientRole || null,
      subject: payload.subject,
      status: "sent",
      sentAt: new Date().toISOString(),
      mode,
      messageId: result.messageId || null,
      linkUrl: linkForLog || null,
      bodyPreviewText: previewText(payload.text),
      bodyPreviewHtml: previewHtml(payload.html),
      relatedStudentId: meta.relatedStudentId || null,
      relatedParentId: meta.relatedParentId || null,
      relatedReservationId: meta.relatedReservationId || null,
      relatedLessonNoteId: meta.relatedLessonNoteId || null,
      relatedNoticeId: meta.relatedNoticeId || null,
      meta,
    });
    return {
      attempted: true,
      sent: true,
      mode,
      messageId: result.messageId || null,
    };
  } catch (error) {
    await recordMailLog({
      type: mailType || "unknown",
      templateName: templateName || mailType || "unknown",
      toEmail,
      recipientEmail: toEmail,
      recipientName: meta.recipientName || null,
      recipientRole: meta.recipientRole || null,
      subject: payload.subject,
      status: "failed",
      failedAt: new Date().toISOString(),
      mode,
      error: error?.message || "mail_send_failed",
      errorMessage: error?.message || "mail_send_failed",
      linkUrl: linkForLog || null,
      bodyPreviewText: previewText(payload.text),
      bodyPreviewHtml: previewHtml(payload.html),
      relatedStudentId: meta.relatedStudentId || null,
      relatedParentId: meta.relatedParentId || null,
      relatedReservationId: meta.relatedReservationId || null,
      relatedLessonNoteId: meta.relatedLessonNoteId || null,
      relatedNoticeId: meta.relatedNoticeId || null,
      meta,
    });
    throw error;
  }
}

export async function sendLoginLinkMail({ toEmail, loginUrl, expiresAt, nextPath, purpose = "login" }) {
  const payload =
    purpose === "registration"
      ? buildRegistrationMail({ loginUrl, expiresAt })
      : buildLoginMail({ loginUrl, expiresAt, nextPath });
  const label = purpose === "registration" ? "registration mail" : "login link";
  const mailType = purpose === "registration" ? "student_registration_verify" : "auth_login_link";
  return deliverMail({
    toEmail,
    payload,
    logLabel: label,
    linkForLog: loginUrl,
    mailType,
    templateName: purpose === "registration" ? "registration_mail" : "login_link_mail",
    meta: { purpose, nextPath: nextPath || "/login/next", recipientRole: "student" },
  });
}

export async function sendPasswordResetMail({ toEmail, resetUrl, expiresAt }) {
  const payload = buildPasswordResetMail({ resetUrl, expiresAt });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "password reset link",
    linkForLog: resetUrl,
    mailType: "password_reset",
    templateName: "password_reset_mail",
    meta: { recipientRole: "student" },
  });
}

export async function sendReservationConfirmedMail({
  toEmail,
  lessonDate,
  teacher,
  lessonType,
  portalUrl = PORTAL_URL,
  relatedStudentId = null,
  relatedReservationId = null,
  recipientName = null,
  recipientRole = "student",
}) {
  const payload = buildReservationConfirmedMail({ lessonDate, teacher, lessonType, portalUrl });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "reservation confirmed",
    linkForLog: portalUrl,
    mailType: "reservation_created",
    templateName: "reservation_created_mail",
    meta: { lessonDate, teacher, lessonType, relatedStudentId, relatedReservationId, recipientName, recipientRole },
  });
}

export async function sendReservationUpdatedMail({
  toEmail,
  lessonDate,
  teacher,
  lessonType,
  portalUrl = PORTAL_URL,
  relatedStudentId = null,
  relatedReservationId = null,
  recipientName = null,
  recipientRole = "student",
}) {
  const payload = buildReservationUpdatedMail({ lessonDate, teacher, lessonType, portalUrl });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "reservation updated",
    linkForLog: portalUrl,
    mailType: "reservation_updated",
    templateName: "reservation_updated_mail",
    meta: { lessonDate, teacher, lessonType, relatedStudentId, relatedReservationId, recipientName, recipientRole },
  });
}

export async function sendLessonReminderMail({
  toEmail,
  lessonDate,
  teacher,
  lessonType,
  portalUrl = PORTAL_URL,
  reminderTiming = "same_day",
  relatedStudentId = null,
  relatedReservationId = null,
  recipientName = null,
  recipientRole = "student",
}) {
  const payload = buildLessonReminderMail({ lessonDate, teacher, lessonType, portalUrl });
  const mailType = reminderTiming === "day_before" ? "lesson_reminder_day_before" : "lesson_reminder_same_day";
  return deliverMail({
    toEmail,
    payload,
    logLabel: "lesson reminder",
    linkForLog: portalUrl,
    mailType,
    templateName: "lesson_reminder_mail",
    meta: { lessonDate, teacher, lessonType, relatedStudentId, relatedReservationId, recipientName, recipientRole },
  });
}

export async function sendLessonNoteStudentMail({
  toEmail,
  lessonDate,
  teacherName,
  lessonTopic,
  reviewPoint,
  homework,
  noteUrl = PORTAL_URL,
  relatedStudentId = null,
  relatedLessonNoteId = null,
  recipientName = null,
}) {
  const payload = buildLessonNoteStudentMail({
    lessonDate,
    teacherName,
    lessonTopic,
    reviewPoint,
    homework,
    noteUrl,
  });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "lesson note student",
    linkForLog: noteUrl,
    mailType: "lesson_note_published",
    templateName: "lesson_note_published_mail",
    meta: {
      lessonDate,
      teacherName,
      recipientRole: "student",
      recipientName,
      relatedStudentId,
      relatedLessonNoteId,
      studentName: recipientName,
    },
  });
}

export async function sendLessonNoteParentMail({
  toEmail,
  lessonDate,
  teacherName,
  lessonTopic,
  reviewPoint,
  homework,
  noteUrl = PORTAL_URL,
  relatedStudentId = null,
  relatedParentId = null,
  relatedLessonNoteId = null,
  recipientName = null,
  studentName = null,
}) {
  const payload = buildLessonNoteParentMail({
    lessonDate,
    teacherName,
    lessonTopic,
    reviewPoint,
    homework,
    noteUrl,
  });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "lesson note parent",
    linkForLog: noteUrl,
    mailType: "lesson_note_published",
    templateName: "lesson_note_published_mail",
    meta: {
      lessonDate,
      teacherName,
      recipientRole: "parent",
      recipientName,
      studentName,
      parentName: recipientName,
      relatedStudentId,
      relatedParentId,
      relatedLessonNoteId,
    },
  });
}

export async function sendHomeworkAssignedStudentMail({
  toEmail,
  homeworkTitle,
  lessonDate,
  homeworkType,
  teacherName,
  homeworkUrl = PORTAL_URL,
  relatedStudentId = null,
  relatedLessonNoteId = null,
  recipientName = null,
}) {
  const payload = buildHomeworkAssignedStudentMail({
    homeworkTitle,
    lessonDate,
    homeworkType,
    teacherName,
    homeworkUrl,
  });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "homework assigned student",
    linkForLog: homeworkUrl,
    mailType: "homework_assigned",
    templateName: "homework_assigned_mail",
    meta: {
      lessonDate,
      teacherName,
      homeworkType,
      recipientRole: "student",
      recipientName,
      studentName: recipientName,
      relatedStudentId,
      relatedLessonNoteId,
    },
  });
}

export async function sendHomeworkAssignedParentMail({
  toEmail,
  studentName,
  homeworkTitle,
  lessonDate,
  homeworkType,
  teacherName,
  homeworkUrl = PORTAL_URL,
  relatedStudentId = null,
  relatedParentId = null,
  relatedLessonNoteId = null,
  recipientName = null,
}) {
  const payload = buildHomeworkAssignedParentMail({
    studentName,
    homeworkTitle,
    lessonDate,
    homeworkType,
    teacherName,
    homeworkUrl,
  });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "homework assigned parent",
    linkForLog: homeworkUrl,
    mailType: "homework_assigned",
    templateName: "homework_assigned_mail",
    meta: {
      lessonDate,
      teacherName,
      homeworkType,
      studentName,
      recipientRole: "parent",
      recipientName,
      parentName: recipientName,
      relatedStudentId,
      relatedParentId,
      relatedLessonNoteId,
    },
  });
}

export async function resendMailFromLog(log) {
  const toEmail = String(log?.recipientEmail || log?.toEmail || "").trim();
  if (!toEmail) throw new Error("再送対象メールアドレスがありません。");
  const subject = String(log?.subject || "").trim() || "【MalMoi韓国語教室】再送メール";
  const actionUrl = String(log?.linkUrl || PORTAL_URL).trim() || PORTAL_URL;
  const payload = buildStudentMailTemplate({
    subject,
    headline: "メールを再送しました",
    introLines: ["下のボタンから内容をご確認ください。"],
    actionLabel: "内容を確認する",
    actionUrl,
    subLines: ["心当たりがない場合はこのメールを破棄してください。"],
  });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "mail log resend",
    linkForLog: actionUrl,
    mailType: String(log?.type || "unknown"),
    templateName: String(log?.templateName || log?.type || "resend"),
    meta: {
      ...(log?.meta || {}),
      recipientName: log?.recipientName || null,
      recipientRole: log?.recipientRole || null,
      relatedStudentId: log?.relatedStudentId || null,
      relatedParentId: log?.relatedParentId || null,
      relatedReservationId: log?.relatedReservationId || null,
      relatedLessonNoteId: log?.relatedLessonNoteId || null,
      relatedNoticeId: log?.relatedNoticeId || null,
      resentFromLogId: log?.id || null,
    },
  });
}

export async function sendNoticePublishedMail({
  toEmail,
  noticeTitle,
  noticeSummary,
  noticeUrl = PORTAL_URL,
  relatedNoticeId = null,
  relatedStudentId = null,
  relatedParentId = null,
  recipientName = null,
  recipientRole = "student",
}) {
  const payload = buildNoticePublishedMail({ noticeTitle, noticeSummary, noticeUrl });
  return deliverMail({
    toEmail,
    payload,
    logLabel: "notice published",
    linkForLog: noticeUrl,
    mailType: "notice_published",
    templateName: "notice_published_mail",
    meta: {
      noticeTitle,
      recipientName,
      recipientRole,
      relatedNoticeId,
      relatedStudentId,
      relatedParentId,
    },
  });
}

function paymentMailSubjectOffice(tx) {
  const name = String(tx.studentNameSnapshot || "").trim() || "氏名未設定";
  const num = String(tx.studentNumberSnapshot || "").trim() || "—";
  const dt = String(tx.paidAt || "").replace("T", " ").slice(0, 16);
  return `【決済記録】${dt} ${name}（${num}）`;
}

function buildPaymentStudentMailBodies(tx, st, { historyUrl, receiptUrl }) {
  const name = String(tx.studentNameSnapshot || st.nameKanji || "").trim() || "お客様";
  const pointsAfter = Number(st.points?.balance ?? 0);
  const remainMin = Number(st.lessonMinutes?.remainingMinutes ?? 0);
  const room = classroomDisplayName();
  const contact = classroomContactFooterText();

  const subject = "【韓国語教室】お支払い完了のお知らせ";
  const text = [
    `${room} からのお知らせ`,
    "",
    `${name} 様`,
    "",
    "お支払いの登録が完了しました。ご利用ありがとうございます。",
    "",
    "■ 決済内容（確定データ）",
    `決済日時: ${tx.paidAt || ""}`,
    `税込金額: ${formatYen(tx.amountTaxInclusive)}`,
    `お支払い方法: ${tx.paymentMethod || "—"}`,
    `付与ポイント: ${tx.finalPoints ?? 0} pt`,
    `換算時間（今回）: ${tx.grantedMinutes ?? 0} 分`,
    "",
    "■ 現在の状態",
    `ポイント残高: ${pointsAfter} pt`,
    `レッスン残り時間: ${remainMin} 分`,
    "",
    "内容はポータルでもご確認いただけます。",
    `履歴: ${historyUrl}`,
    receiptUrl ? `領収書（確認用）: ${receiptUrl}` : "",
    "",
    contact,
    "",
    "※本メールは保存済みの決済結果に基づく自動通知です。",
  ]
    .filter(Boolean)
    .join("\n");

  const cardBg = "#ffffff";
  const pageBg = "#f3f6fb";
  const accent = "#2f6df6";
  const html = `
<div style="margin:0;padding:20px 12px;background:${pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans JP',sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:20px 18px 8px;text-align:center;">
        <p style="margin:0;font-size:12px;letter-spacing:0.12em;color:#64748b;">${escapeHtml(room)}</p>
        <p style="margin:10px 0 0;font-size:18px;font-weight:700;color:#0f172a;">お支払いが完了しました</p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.65;color:#475569;">${escapeHtml(name)} 様、ご利用ありがとうございます。<br/>以下は登録済みの確定内容です。</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 12px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cardBg};border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr><td style="padding:14px 16px 6px;font-size:12px;font-weight:700;color:#64748b;">決済の概要</td></tr>
          <tr><td style="padding:4px 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
              ${[
                ["決済日時", String(tx.paidAt || "").replace("T", " ").slice(0, 16)],
                ["税込金額", formatYen(tx.amountTaxInclusive)],
                ["お支払い方法", tx.paymentMethod || "—"],
                ["付与ポイント", `${tx.finalPoints ?? 0} pt`],
                ["換算時間（今回）", `${tx.grantedMinutes ?? 0} 分`],
              ]
                .map(
                  ([k, v]) =>
                    `<tr><td style="padding:6px 0;border-bottom:1px solid #f1f5f9;color:#64748b;width:42%;">${escapeHtml(k)}</td><td style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-weight:700;">${escapeHtml(String(v))}</td></tr>`,
                )
                .join("")}
            </table>
          </td></tr>
          <tr><td style="padding:14px 16px 6px;font-size:12px;font-weight:700;color:#64748b;">現在の状態</td></tr>
          <tr><td style="padding:4px 16px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr><td style="padding:6px 0;color:#64748b;">ポイント残高</td><td style="padding:6px 0;font-weight:800;color:${accent};">${pointsAfter} pt</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">レッスン残り時間</td><td style="padding:6px 0;font-weight:800;color:${accent};">${remainMin} 分</td></tr>
            </table>
          </td></tr>
        </table>
        <div style="text-align:center;margin-top:16px;">
          <a href="${escapeHtml(historyUrl)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">決済履歴を見る</a>
        </div>
        ${
          receiptUrl
            ? `<div style="text-align:center;margin-top:10px;"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:10px 16px;border-radius:10px;border:1px solid #cbd5e1;color:#1e3a8a;text-decoration:none;font-weight:700;font-size:13px;">領収書を確認する</a></div>`
            : ""
        }
        <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#64748b;">内容に心当たりがない場合やご不明点は、${escapeHtml(contact || "教室")}までご連絡ください。</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 16px 24px;font-size:11px;color:#94a3b8;text-align:center;line-height:1.5;">
        本メールは保存済みの決済結果に基づく自動通知です（再計算は行っていません）。
      </td>
    </tr>
  </table>
</div>`.trim();

  return { subject, text, html };
}

function buildPaymentOfficeMailBodies(tx, st, actor) {
  const name = String(tx.studentNameSnapshot || "").trim() || "—";
  const sid = String(tx.studentId || "").trim();
  const studentEmail = String(st.email || "").trim();
  const converted = Number(tx.grantedMinutes || 0);
  const subject = paymentMailSubjectOffice(tx);

  const rowsA = [
    ["学生名", `${name}（${tx.studentNumberSnapshot || "—"}）`],
    ["会員番号", tx.studentNumberSnapshot || "—"],
    ["学生ID", sid],
    ["学生メール", studentEmail || "—"],
  ];
  const rowsB = [
    ["決済ID", tx.id],
    ["決済日時", tx.paidAt || "—"],
    ["お支払い方法", tx.paymentMethod || "—"],
    ["区分", jpTransactionKind(tx)],
    ["ステータス", "完了"],
  ];
  const rowsC = [
    ["税抜金額", formatYen(tx.amountTaxExclusive)],
    ["消費税", formatYen(tx.taxAmount)],
    ["税込金額", formatYen(tx.amountTaxInclusive)],
    ["税率", `${tx.taxRatePercent ?? 0}%`],
  ];
  const rowsD = [
    ["適用ルール種別", jpAppliedRuleType(tx)],
    ["基本付与ポイント", `${tx.basePoints ?? 0} pt`],
    ["ボーナスポイント", `${tx.bonusPoints ?? 0} pt`],
    ["追加ポイント", `${tx.manualPoints ?? 0} pt`],
    ["合計付与ポイント", `${tx.finalPoints ?? 0} pt`],
    ["換算時間", `${converted} 分`],
  ];
  const rowsE = [
    ["登録者（ユーザーID）", actor?.userId || "—"],
    ["備考", tx.note || "—"],
  ];

  const sec = (title, rows) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:10px 14px;background:#0f172a;color:#f8fafc;font-size:13px;font-weight:700;">${escapeHtml(title)}</td></tr>
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;width:38%;">${escapeHtml(k)}</td><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">${escapeHtml(String(v))}</td></tr>`,
        )
        .join("")}
    </table>`;

  const html = `
<div style="margin:0;padding:16px 10px;background:#f8fafc;font-family:ui-monospace,monospace,'Noto Sans JP',sans-serif;color:#0f172a;">
  <p style="margin:0 0 2px;font-size:11px;color:#64748b;">自動生成された決済記録（検索・復旧用）</p>
  <p style="margin:0 0 14px;font-size:15px;font-weight:800;">決済記録</p>
  ${sec("A. 学生情報", rowsA)}
  ${sec("B. 決済情報", rowsB)}
  ${sec("C. 金額・税", rowsC)}
  ${sec("D. ポイント・時間", rowsD)}
  ${sec("E. 運用", rowsE)}
  <p style="margin:0;font-size:11px;color:#94a3b8;">※本文は保存済みの決済結果に基づきます（再計算なし）。</p>
</div>`.trim();

  const text = [
    subject,
    "",
    "【自動記録】",
    "A 学生情報",
    ...rowsA.map(([k, v]) => `${k}: ${v}`),
    "",
    "B 決済情報",
    ...rowsB.map(([k, v]) => `${k}: ${v}`),
    "",
    "C 金額",
    ...rowsC.map(([k, v]) => `${k}: ${v}`),
    "",
    "D ポイント・時間",
    ...rowsD.map(([k, v]) => `${k}: ${v}`),
    "",
    "E 運用",
    ...rowsE.map(([k, v]) => `${k}: ${v}`),
  ].join("\n");

  return { subject, text, html };
}

/** 学生向けのみ（確定データのみ） */
export async function sendPaymentStudentMailOnly({ transaction, student, actor, attachPdf = true }) {
  const tx = transaction || {};
  const sid = String(tx.studentId || "").trim();
  const st = student || {};
  const studentEmail = String(st.email || "").trim();
  if (!studentEmail) {
    return { attempted: false, sent: false, mode: "no_email" };
  }
  let pdfBuf = null;
  if (attachPdf) {
    try {
      const { buildPaymentReceiptPdfBytes } = await import("../payments/receipt-pdf.js");
      pdfBuf = await buildPaymentReceiptPdfBytes(tx, "receipt");
    } catch (e) {
      console.error("receipt pdf gen", e);
    }
  }
  const historyUrl = `${PORTAL_URL}/student/payments`;
  const receiptUrl = `${PORTAL_URL}/student/payments/${tx.id}`;
  const bodies = buildPaymentStudentMailBodies(tx, st, { historyUrl, receiptUrl });
  const attach =
    attachPdf && pdfBuf && Buffer.isBuffer(pdfBuf)
      ? [{ filename: `receipt_${tx.id}.pdf`, content: pdfBuf, contentType: "application/pdf" }]
      : null;
  const studentResult = await deliverMail({
    toEmail: studentEmail,
    payload: { subject: bodies.subject, text: bodies.text, html: bodies.html },
    logLabel: "payment completed student",
    linkForLog: PORTAL_URL,
    mailType: "payment_completed",
    templateName: "payment_completed_student",
    attachments: attach,
    meta: {
      relatedStudentId: sid,
      recipientRole: "student",
      paymentTransactionId: tx.id,
      receiptPdfAttached: Boolean(attach?.length),
    },
  });
  return { ...studentResult, receiptPdfGenerated: Boolean(pdfBuf) };
}

/** 教室向けのみ（運用記録） */
export async function sendPaymentOfficeMailOnly({ transaction, student, actor }) {
  const tx = transaction || {};
  const sid = String(tx.studentId || "").trim();
  const st = student || {};
  const bodies = buildPaymentOfficeMailBodies(tx, st, actor);
  const officeTo = officeInboxEmail();
  const officeResult = await deliverMail({
    toEmail: officeTo,
    payload: { subject: bodies.subject, text: bodies.text, html: bodies.html },
    logLabel: "payment completed office",
    linkForLog: null,
    mailType: "payment_completed_office",
    templateName: "payment_completed_office",
    meta: {
      relatedStudentId: sid,
      recipientRole: "admin",
      paymentTransactionId: tx.id,
    },
  });
  return officeResult;
}

/** 決済確定メール（学生・教室）。本文は PaymentTransaction の確定値のみを使用（再計算しない） */
export async function sendPaymentCompletedMails({ transaction, student, actor }) {
  const studentEmail = String(student?.email || "").trim();
  const studentResult = studentEmail
    ? await sendPaymentStudentMailOnly({ transaction, student, actor, attachPdf: true })
    : { attempted: false, sent: false, mode: "skipped" };
  const officeResult = await sendPaymentOfficeMailOnly({ transaction, student, actor });
  return {
    studentSent: Boolean(studentEmail && studentResult?.sent),
    officeSent: Boolean(officeResult?.sent),
    student: studentResult,
    office: officeResult,
    receiptPdfGenerated: Boolean(studentResult?.receiptPdfGenerated),
  };
}

/** 教室向け：期間集計（getSalesDashboardForAdmin の結果のみ使用） */
export async function sendPaymentOfficeSummaryMail({ rangeTitle, fromDate, toDate, sum, byMethod, studentRows }) {
  const officeTo = officeInboxEmail();
  const s = sum || {};
  const methods = Object.entries(byMethod || {});
  const topStudents = (studentRows || []).slice(0, 25);
  const subject =
    rangeTitle === "daily"
      ? `【決済日報】${String(fromDate || "").slice(0, 10)} の決済サマリー`
      : rangeTitle === "weekly"
        ? `【決済週報】${String(fromDate || "").slice(0, 10)}〜${String(toDate || "").slice(0, 10)}`
        : `【決済集計】${String(fromDate || "")}〜${String(toDate || "")}`;

  const html = `
<div style="margin:0;padding:16px 10px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',sans-serif;color:#0f172a;">
  <p style="margin:0 0 8px;font-size:13px;font-weight:800;">${escapeHtml(subject)}</p>
  <p style="margin:0 0 12px;font-size:12px;color:#64748b;">対象期間: ${escapeHtml(String(fromDate || ""))} 〜 ${escapeHtml(String(toDate || ""))}（保存済み決済のみ）</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:12px;">
    <tr><td style="padding:10px 14px;font-size:12px;font-weight:700;background:#0f172a;color:#f8fafc;">A. 期間サマリー</td></tr>
    <tr><td style="padding:12px 14px;font-size:13px;">
      件数: <strong>${s.count ?? 0}</strong><br/>
      税抜売上: <strong>${formatYen(s.amountTaxExclusive)}</strong><br/>
      消費税計: <strong>${formatYen(s.taxAmount)}</strong><br/>
      税込売上: <strong>${formatYen(s.amountTaxInclusive)}</strong><br/>
      付与ポイント計: <strong>${s.totalPoints ?? 0} pt</strong><br/>
      換算時間計: <strong>${s.totalMinutes ?? 0} 分</strong><br/>
      手動含む件数: <strong>${s.manualGrantCount ?? 0}</strong>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:12px;">
    <tr><td style="padding:10px 14px;font-size:12px;font-weight:700;background:#1e293b;color:#f8fafc;">B. 支払方法別</td></tr>
    <tr><td style="padding:12px 14px;font-size:13px;">
      ${methods
        .map(
          ([k, v]) =>
            `${escapeHtml(k)}: ${v?.count ?? 0} 件 / 税込 ${formatYen(v?.amountTaxInclusive)}<br/>`,
        )
        .join("")}
      ${methods.length === 0 ? "—" : ""}
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
    <tr><td style="padding:10px 14px;font-size:12px;font-weight:700;background:#334155;color:#f8fafc;">C. 学生別（上位）</td></tr>
    <tr><td style="padding:12px 14px;font-size:12px;">
      ${topStudents
        .map(
          (r) =>
            `${escapeHtml(r.studentName || "")} / ${escapeHtml(String(r.studentNumber || ""))} 件数 ${r.count} / 税込 ${formatYen(r.amountTaxInclusive)}<br/>`,
        )
        .join("")}
      ${topStudents.length === 0 ? "—" : ""}
    </td></tr>
  </table>
  <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">※集計は保存済み決済データに基づきます（再計算なし）。</p>
</div>`.trim();

  const text = [
    subject,
    `期間: ${fromDate}〜${toDate}`,
    `件数 ${s.count ?? 0} / 税込 ${formatYen(s.amountTaxInclusive)} / PT ${s.totalPoints ?? 0} / 時間 ${s.totalMinutes ?? 0} 分`,
  ].join("\n");

  return deliverMail({
    toEmail: officeTo,
    payload: { subject, text, html },
    logLabel: "payment summary office",
    linkForLog: null,
    mailType: "payment_summary_office",
    templateName: "payment_summary_office",
    meta: { fromDate, toDate, rangeTitle },
  });
}

"use client";

import { useMemo, useState } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";

const TABS = [
  { id: "schoolBasic", label: "教室基本設定" },
  { id: "reservation", label: "予約設定" },
  { id: "lesson", label: "レッスン設定" },
  { id: "homework", label: "宿題設定" },
  { id: "notifications", label: "通知設定" },
  { id: "mail", label: "メール設定" },
  { id: "security", label: "セキュリティ設定" },
  { id: "parent", label: "保護者設定" },
  { id: "pair", label: "ペア設定" },
  { id: "systemInfo", label: "システム情報" },
  { id: "changeLogs", label: "設定変更ログ" },
];

const SUPER_ADMIN_ONLY_SECTIONS = new Set(["mail", "security"]);

function boolLabel(value) {
  return value ? "ON" : "OFF";
}

export default function SystemSettingsPanel({
  initialSettings,
  initialSystemInfo,
  initialLogs = [],
  initialLogPagination,
  adminRank = "ADMIN",
}) {
  const [activeTab, setActiveTab] = useState("schoolBasic");
  const [settings, setSettings] = useState(initialSettings || {});
  const [systemInfo, setSystemInfo] = useState(initialSystemInfo || {});
  const [logs, setLogs] = useState(initialLogs || []);
  const [logPagination, setLogPagination] = useState(
    initialLogPagination || { page: 1, pageSize: 20, total: initialLogs.length, totalPages: 1, hasNext: false, hasPrev: false }
  );
  const [status, setStatus] = useState({ type: "", text: "" });
  const [savingSection, setSavingSection] = useState("");
  const [testMailTo, setTestMailTo] = useState("");
  const [testMailRecipientName, setTestMailRecipientName] = useState("");
  const [logSectionFilter, setLogSectionFilter] = useState("");
  const isSuperAdmin = String(adminRank || "").toUpperCase() === "SUPER_ADMIN";

  const canEditSection = (section) => !SUPER_ADMIN_ONLY_SECTIONS.has(section) || isSuperAdmin;

  async function saveSection(section, patch) {
    if (!canEditSection(section)) {
      setStatus({ type: "error", text: "このセクションはSUPER ADMINのみ変更できます。" });
      return;
    }
    if (SUPER_ADMIN_ONLY_SECTIONS.has(section)) {
      const confirmed = window.confirm("重要設定を変更します。内容を確認の上、続行しますか？");
      if (!confirmed) return;
    }
    setSavingSection(section);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, patch }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "設定保存に失敗しました。");
      setSettings((prev) => ({ ...prev, [section]: data.result.settings }));
      setStatus({ type: "success", text: `${TABS.find((item) => item.id === section)?.label || section} を保存しました。` });
      await loadLogs(1, logSectionFilter);
      if (section === "reservation" || section === "lesson" || section === "mail") {
        await loadSystemInfo();
      }
    } catch (error) {
      setStatus({ type: "error", text: error?.message || "設定保存中にエラーが発生しました。" });
    } finally {
      setSavingSection("");
    }
  }

  async function loadLogs(page = 1, section = "") {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(logPagination.pageSize || 20));
    if (section) params.set("section", section);
    const response = await fetch(`/api/admin/system-settings/logs?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "設定ログ取得に失敗しました。");
    setLogs(data.logs || []);
    setLogPagination(data.pagination || logPagination);
  }

  async function loadSystemInfo() {
    const response = await fetch("/api/admin/system-settings/system-info");
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "システム情報の取得に失敗しました。");
    setSystemInfo(data.info || {});
  }

  async function sendTestMail() {
    if (!testMailTo) {
      setStatus({ type: "error", text: "テストメール送信先を入力してください。" });
      return;
    }
    setSavingSection("mail:test");
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/admin/system-settings/test-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testMailTo, recipientName: testMailRecipientName }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "テストメール送信に失敗しました。");
      setStatus({ type: "success", text: "テストメールを送信しました。" });
    } catch (error) {
      setStatus({ type: "error", text: error?.message || "テストメール送信中にエラーが発生しました。" });
    } finally {
      setSavingSection("");
    }
  }

  const schoolBasic = settings.schoolBasic || {};
  const reservation = settings.reservation || {};
  const lesson = settings.lesson || {};
  const homework = settings.homework || {};
  const notifications = settings.notifications || {};
  const mail = settings.mail || {};
  const security = settings.security || {};
  const parent = settings.parent || {};
  const pair = settings.pair || {};

  const logRows = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        changedKeys: (log.changedFields || []).map((item) => item.key).join(", "),
      })),
    [logs]
  );

  return (
    <section className={adminStyles.sectionBlock}>
      <div className={adminStyles.compactActions}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${adminStyles.chipButton} ${activeTab === tab.id ? adminStyles.chipButtonActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className={adminStyles.smallMuted}>
        権限: {adminRank} / SUPER ADMIN専用: メール設定・セキュリティ設定
      </p>
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>{status.text}</p>
      ) : null}

      {activeTab === "schoolBasic" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>教室基本設定</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>教室名<input className={styles.field} value={schoolBasic.schoolName || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, schoolName: e.target.value } }))} /></label>
            <label className={styles.label}>教室表示名<input className={styles.field} value={schoolBasic.displayName || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, displayName: e.target.value } }))} /></label>
            <label className={styles.label}>電話番号<input className={styles.field} value={schoolBasic.phone || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, phone: e.target.value } }))} /></label>
            <label className={styles.label}>メール<input className={styles.field} value={schoolBasic.email || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, email: e.target.value } }))} /></label>
            <label className={styles.label}>営業時間開始<input className={styles.field} value={schoolBasic.businessHoursStart || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, businessHoursStart: e.target.value } }))} /></label>
            <label className={styles.label}>営業時間終了<input className={styles.field} value={schoolBasic.businessHoursEnd || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, businessHoursEnd: e.target.value } }))} /></label>
          </div>
          <label className={styles.label}>住所<textarea className={styles.field} rows={2} value={schoolBasic.address || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, address: e.target.value } }))} /></label>
          <label className={styles.label}>休業日<textarea className={styles.field} rows={2} value={schoolBasic.holidays || ""} onChange={(e) => setSettings((prev) => ({ ...prev, schoolBasic: { ...schoolBasic, holidays: e.target.value } }))} /></label>
          <div className={adminStyles.compactActions}>
            <button className={styles.button} type="button" disabled={savingSection === "schoolBasic"} onClick={() => saveSection("schoolBasic", schoolBasic)}>
              {savingSection === "schoolBasic" ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === "reservation" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>予約設定</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>予約方式
              <select className={styles.field} value={reservation.reservationMode || "time_unit"} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, reservationMode: e.target.value } }))}>
                <option value="time_unit">時間単位</option>
                <option value="course_unit">コース単位</option>
              </select>
            </label>
            <label className={styles.label}>時間生成モード
              <select className={styles.field} value={reservation.timeGenerationMode || "direct_input"} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, timeGenerationMode: e.target.value } }))}>
                <option value="all_times">all_times</option>
                <option value="course_auto">course_auto</option>
                <option value="direct_input">direct_input</option>
              </select>
            </label>
            <label className={styles.label}>営業時間開始<input className={styles.field} value={reservation.operatingStartTime || ""} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, operatingStartTime: e.target.value } }))} /></label>
            <label className={styles.label}>営業時間終了<input className={styles.field} value={reservation.operatingEndTime || ""} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, operatingEndTime: e.target.value } }))} /></label>
            <label className={styles.label}>予約準備時間(分)<input className={styles.field} type="number" value={reservation.prepMinutes ?? 10} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, prepMinutes: Number(e.target.value || 0) } }))} /></label>
            <label className={styles.label}>最大予約期間(日)<input className={styles.field} type="number" value={reservation.maxBookableDays ?? 30} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, maxBookableDays: Number(e.target.value || 30) } }))} /></label>
            <label className={styles.label}>当日予約許可
              <select className={styles.field} value={reservation.allowSameDayBooking ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, allowSameDayBooking: e.target.value === "1" } }))}>
                <option value="1">ON</option>
                <option value="0">OFF</option>
              </select>
            </label>
            <label className={styles.label}>キャンセル期限(時間前)<input className={styles.field} type="number" value={reservation.cancelCutoffHours ?? 3} onChange={(e) => setSettings((prev) => ({ ...prev, reservation: { ...reservation, cancelCutoffHours: Number(e.target.value || 0) } }))} /></label>
          </div>
          <div className={adminStyles.compactActions}><button className={styles.button} type="button" disabled={savingSection === "reservation"} onClick={() => saveSection("reservation", reservation)}>{savingSection === "reservation" ? "保存中..." : "保存"}</button></div>
        </div>
      ) : null}

      {activeTab === "lesson" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>レッスン設定</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>基本レッスン時間(分, カンマ区切り)
              <input className={styles.field} value={(lesson.defaultLessonDurations || []).join(",")} onChange={(e) => setSettings((prev) => ({ ...prev, lesson: { ...lesson, defaultLessonDurations: String(e.target.value || "").split(",").map((v) => Number(v.trim() || 0)).filter(Boolean) } }))} />
            </label>
            <label className={styles.label}>ペア許可
              <select className={styles.field} value={lesson.pairLessonEnabled ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, lesson: { ...lesson, pairLessonEnabled: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
            <label className={styles.label}>グループ許可
              <select className={styles.field} value={lesson.groupLessonEnabled ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, lesson: { ...lesson, groupLessonEnabled: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
            <label className={styles.label}>最大グループ人数
              <input className={styles.field} type="number" value={lesson.maxGroupCapacity ?? 4} onChange={(e) => setSettings((prev) => ({ ...prev, lesson: { ...lesson, maxGroupCapacity: Number(e.target.value || 1) } }))} />
            </label>
            <label className={styles.label}>レッスンノート自動公開
              <select className={styles.field} value={lesson.autoShareLessonNote ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, lesson: { ...lesson, autoShareLessonNote: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
          </div>
          <div className={adminStyles.compactActions}><button className={styles.button} type="button" disabled={savingSection === "lesson"} onClick={() => saveSection("lesson", lesson)}>{savingSection === "lesson" ? "保存中..." : "保存"}</button></div>
        </div>
      ) : null}

      {activeTab === "homework" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>宿題設定</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>宿題機能
              <select className={styles.field} value={homework.homeworkEnabled ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, homework: { ...homework, homeworkEnabled: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
            <label className={styles.label}>学生 상태 변경 허용
              <select className={styles.field} value={homework.allowStudentStatusUpdate ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, homework: { ...homework, allowStudentStatusUpdate: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
            <label className={styles.label}>保護者 숙제 확인 허용
              <select className={styles.field} value={homework.allowParentHomeworkView ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, homework: { ...homework, allowParentHomeworkView: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
            <label className={styles.label}>宿題状態一覧(カンマ区切り)
              <input className={styles.field} value={(homework.statuses || []).join(",")} onChange={(e) => setSettings((prev) => ({ ...prev, homework: { ...homework, statuses: String(e.target.value || "").split(",").map((v) => v.trim()).filter(Boolean) } }))} />
            </label>
          </div>
          <div className={adminStyles.compactActions}><button className={styles.button} type="button" disabled={savingSection === "homework"} onClick={() => saveSection("homework", homework)}>{savingSection === "homework" ? "保存中..." : "保存"}</button></div>
        </div>
      ) : null}

      {activeTab === "notifications" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>通知設定</h3>
          <p className={adminStyles.smallMuted}>
            通知の送信は<strong>メール</strong>を基本とします。LINE 等の外部チャット連携は行いません。お知らせ・予約・ノート・宿題の詳細はポータル内で確認してください。
          </p>
          <div className={adminStyles.compactFormGrid}>
            {[
              ["noticePublished", "新しいお知らせ通知"],
              ["lessonReminderDayBefore", "レッスン前日通知"],
              ["lessonReminderSameDay", "レッスン当日通知"],
              ["homeworkAssigned", "宿題通知"],
              ["lessonNotePublished", "レッスンノート通知"],
            ].map(([key, label]) => (
              <label key={key} className={styles.label}>{label}
                <select className={styles.field} value={notifications[key] ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, notifications: { ...notifications, [key]: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select>
              </label>
            ))}
          </div>
          <div className={adminStyles.compactActions}><button className={styles.button} type="button" disabled={savingSection === "notifications"} onClick={() => saveSection("notifications", notifications)}>{savingSection === "notifications" ? "保存中..." : "保存"}</button></div>
        </div>
      ) : null}

      {activeTab === "mail" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>メール設定 {isSuperAdmin ? "" : "(閲覧のみ)"}</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>送信モード
              <select className={styles.field} value={mail.sendMode || "log"} onChange={(e) => setSettings((prev) => ({ ...prev, mail: { ...mail, sendMode: e.target.value } }))} disabled={!canEditSection("mail")}><option value="smtp">smtp</option><option value="log">log</option></select>
            </label>
            <label className={styles.label}>MAIL_FROM<input className={styles.field} value={mail.mailFrom || ""} onChange={(e) => setSettings((prev) => ({ ...prev, mail: { ...mail, mailFrom: e.target.value } }))} disabled={!canEditSection("mail")} /></label>
            <label className={styles.label}>SMTP HOST<input className={styles.field} value={mail.smtpHost || ""} onChange={(e) => setSettings((prev) => ({ ...prev, mail: { ...mail, smtpHost: e.target.value } }))} disabled={!canEditSection("mail")} /></label>
            <label className={styles.label}>SMTP PORT<input className={styles.field} value={mail.smtpPort || ""} onChange={(e) => setSettings((prev) => ({ ...prev, mail: { ...mail, smtpPort: e.target.value } }))} disabled={!canEditSection("mail")} /></label>
            <label className={styles.label}>SMTP USER<input className={styles.field} value={mail.smtpUser || ""} onChange={(e) => setSettings((prev) => ({ ...prev, mail: { ...mail, smtpUser: e.target.value } }))} disabled={!canEditSection("mail")} /></label>
            <label className={styles.label}>SMTP PASS(マスク)<input className={styles.field} value={mail.smtpPassMasked || ""} onChange={(e) => setSettings((prev) => ({ ...prev, mail: { ...mail, smtpPassMasked: e.target.value } }))} disabled={!canEditSection("mail")} /></label>
            <label className={styles.label}>SMTP SECURE<input className={styles.field} value={mail.smtpSecure || ""} onChange={(e) => setSettings((prev) => ({ ...prev, mail: { ...mail, smtpSecure: e.target.value } }))} disabled={!canEditSection("mail")} /></label>
          </div>
          <p className={adminStyles.smallMuted}>{mail.note || "実際のSMTP接続は環境変数が優先されます。"}</p>
          <div className={adminStyles.compactActions}>
            <button className={styles.button} type="button" disabled={savingSection === "mail" || !canEditSection("mail")} onClick={() => saveSection("mail", mail)}>
              {savingSection === "mail" ? "保存中..." : "保存"}
            </button>
          </div>
          <div className={adminStyles.groupBlock}>
            <h4 className={adminStyles.groupTitle}>テストメール送信</h4>
            <label className={styles.label}>宛先メール<input className={styles.field} value={testMailTo} onChange={(e) => setTestMailTo(e.target.value)} /></label>
            <label className={styles.label}>宛先表示名<input className={styles.field} value={testMailRecipientName} onChange={(e) => setTestMailRecipientName(e.target.value)} /></label>
            <button className={styles.button} type="button" disabled={savingSection === "mail:test"} onClick={sendTestMail}>
              {savingSection === "mail:test" ? "送信中..." : "テストメール送信"}
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === "security" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>セキュリティ設定 {isSuperAdmin ? "" : "(閲覧のみ)"}</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>初期パスワード設定
              <select className={styles.field} value={security.initialPasswordMode || "phone_last4"} onChange={(e) => setSettings((prev) => ({ ...prev, security: { ...security, initialPasswordMode: e.target.value } }))} disabled={!canEditSection("security")}><option value="phone_last4">電話番号下4桁</option><option value="random">ランダム生成</option></select>
            </label>
            <label className={styles.label}>初回パスワード変更
              <select className={styles.field} value={security.forcePasswordChangeOnFirstLogin ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, security: { ...security, forcePasswordChangeOnFirstLogin: e.target.value === "1" } }))} disabled={!canEditSection("security")}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
            <label className={styles.label}>パスワード再設定許可
              <select className={styles.field} value={security.allowPasswordReset ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, security: { ...security, allowPasswordReset: e.target.value === "1" } }))} disabled={!canEditSection("security")}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
            <label className={styles.label}>ログイン試行制限<input className={styles.field} type="number" value={security.loginAttemptLimit ?? 5} onChange={(e) => setSettings((prev) => ({ ...prev, security: { ...security, loginAttemptLimit: Number(e.target.value || 1) } }))} disabled={!canEditSection("security")} /></label>
            <label className={styles.label}>管理者2段階認証
              <select className={styles.field} value={security.adminTwoFactorEnabled ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, security: { ...security, adminTwoFactorEnabled: e.target.value === "1" } }))} disabled={!canEditSection("security")}><option value="1">ON</option><option value="0">OFF</option></select>
            </label>
          </div>
          <div className={adminStyles.compactActions}><button className={styles.button} type="button" disabled={savingSection === "security" || !canEditSection("security")} onClick={() => saveSection("security", security)}>{savingSection === "security" ? "保存中..." : "保存"}</button></div>
        </div>
      ) : null}

      {activeTab === "parent" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>保護者設定</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>保護者アカウント機能<select className={styles.field} value={parent.parentAccountEnabled ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, parent: { ...parent, parentAccountEnabled: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>未成年自動保護者登録<select className={styles.field} value={parent.autoParentForMinor ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, parent: { ...parent, autoParentForMinor: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>予約閲覧<select className={styles.field} value={parent.canViewReservations ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, parent: { ...parent, canViewReservations: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>ノート閲覧<select className={styles.field} value={parent.canViewLessonNotes ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, parent: { ...parent, canViewLessonNotes: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>宿題閲覧<select className={styles.field} value={parent.canViewHomework ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, parent: { ...parent, canViewHomework: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>学習状況閲覧<select className={styles.field} value={parent.canViewProgress ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, parent: { ...parent, canViewProgress: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
          </div>
          <div className={adminStyles.compactActions}><button className={styles.button} type="button" disabled={savingSection === "parent"} onClick={() => saveSection("parent", parent)}>{savingSection === "parent" ? "保存中..." : "保存"}</button></div>
        </div>
      ) : null}

      {activeTab === "pair" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>ペア設定</h3>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>ペア許可<select className={styles.field} value={pair.pairLessonEnabled ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, pair: { ...pair, pairLessonEnabled: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>ペア自動予約作成<select className={styles.field} value={pair.pairAutoReservationCreate ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, pair: { ...pair, pairAutoReservationCreate: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>ペアノート共有<select className={styles.field} value={pair.pairShareLessonNote ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, pair: { ...pair, pairShareLessonNote: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
            <label className={styles.label}>ペア宿題共有<select className={styles.field} value={pair.pairShareHomework ? "1" : "0"} onChange={(e) => setSettings((prev) => ({ ...prev, pair: { ...pair, pairShareHomework: e.target.value === "1" } }))}><option value="1">ON</option><option value="0">OFF</option></select></label>
          </div>
          <div className={adminStyles.compactActions}><button className={styles.button} type="button" disabled={savingSection === "pair"} onClick={() => saveSection("pair", pair)}>{savingSection === "pair" ? "保存中..." : "保存"}</button></div>
        </div>
      ) : null}

      {activeTab === "systemInfo" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>システム情報</h3>
          <ul className={adminStyles.tableLike}>
            <li>システムバージョン: {systemInfo.systemVersion || "-"}</li>
            <li>最終デプロイ日時: {systemInfo.lastDeployAt || "-"}</li>
            <li>登録学生数: {systemInfo.studentCount ?? 0}</li>
            <li>登録保護者数: {systemInfo.parentCount ?? 0}</li>
            <li>登録講師数: {systemInfo.teacherCount ?? 0}</li>
            <li>予約数: {systemInfo.reservationCount ?? 0}</li>
            <li>レッスンノート数: {systemInfo.lessonNoteCount ?? 0}</li>
            <li>宿題数: {systemInfo.homeworkCount ?? 0}</li>
            <li>メール送信数: {systemInfo.mailCount ?? 0}</li>
          </ul>
          <div className={adminStyles.compactActions}>
            <button className={styles.button} type="button" onClick={loadSystemInfo}>再読み込み</button>
          </div>
        </div>
      ) : null}

      {activeTab === "changeLogs" ? (
        <div className={adminStyles.groupBlock}>
          <h3 className={adminStyles.groupTitle}>設定変更ログ</h3>
          <div className={adminStyles.compactActions}>
            <select className={styles.field} value={logSectionFilter} onChange={(e) => setLogSectionFilter(e.target.value)}>
              <option value="">全体</option>
              {TABS.filter((tab) => !["systemInfo", "changeLogs"].includes(tab.id)).map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
            <button className={styles.button} type="button" onClick={() => loadLogs(1, logSectionFilter)}>検索</button>
          </div>
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>変更日時</th>
                  <th>変更者</th>
                  <th>設定項目</th>
                  <th>変更前/変更後</th>
                </tr>
              </thead>
              <tbody>
                {logRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.changedAt || "-"}</td>
                    <td>{row.changedByName || row.changedByUserId || "-"}</td>
                    <td>{row.section} / {row.changedKeys}</td>
                    <td>
                      <pre className={adminStyles.metaPre}>{JSON.stringify(row.changedFields || [], null, 2)}</pre>
                    </td>
                  </tr>
                ))}
                {logRows.length === 0 ? (
                  <tr><td colSpan={4}>設定変更ログがありません。</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className={adminStyles.compactActions}>
            <button className={styles.button} type="button" disabled={!logPagination?.hasPrev} onClick={() => loadLogs(Math.max(1, (logPagination?.page || 1) - 1), logSectionFilter)}>前へ</button>
            <button className={styles.button} type="button" disabled={!logPagination?.hasNext} onClick={() => loadLogs((logPagination?.page || 1) + 1, logSectionFilter)}>次へ</button>
          </div>
        </div>
      ) : null}

      {activeTab !== "systemInfo" && activeTab !== "changeLogs" ? (
        <p className={adminStyles.smallMuted}>
          ※ 危険度の高い設定(メール/セキュリティ)は確認モーダル後に保存され、設定変更ログに記録됩니다。
        </p>
      ) : null}
      <p className={adminStyles.smallMuted}>
        通知・メール設定은 `MAIL_SEND_MODE` / `SMTP_*` 환경변수와 연동되며, 런타임에는 환경변수가 우선됩니다。
      </p>
      <p className={adminStyles.smallMuted}>
        現在の通知設定: お知らせ {boolLabel(notifications.noticePublished)} / 前日 {boolLabel(notifications.lessonReminderDayBefore)} / 当日 {boolLabel(notifications.lessonReminderSameDay)} / 宿題 {boolLabel(notifications.homeworkAssigned)} / ノート {boolLabel(notifications.lessonNotePublished)}
      </p>
    </section>
  );
}

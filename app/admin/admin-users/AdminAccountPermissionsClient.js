"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";

const PROFILE_IMAGE_MAX_BYTES = 900 * 1024;

function formatLastLoginJa(iso) {
  if (!iso) return "記録なし";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 19).replace("T", " ");
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Tokyo",
    }).format(d);
  } catch {
    return String(iso).slice(0, 19);
  }
}

function accountStatusJa(status) {
  const s = String(status || "").toLowerCase();
  if (s === "inactive") return "利用停止";
  return "利用中";
}

export default function AdminAccountPermissionsClient({ initialAdmins = [], initialInvites = [], adminRank = "ADMIN" }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [invites, setInvites] = useState(initialInvites);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [savingId, setSavingId] = useState("");
  const [inviteRole, setInviteRole] = useState("teacher");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStudentId, setInviteStudentId] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("父");
  const [inviteName, setInviteName] = useState("");
  const [inviteSending, setInviteSending] = useState(false);

  const isSuper = String(adminRank || "").toUpperCase() === "SUPER_ADMIN";

  async function reloadInvites() {
    const res = await fetch("/api/admin/role-invitations", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setInvites(data.invitations || []);
  }

  async function saveAdmin(adminId, patch) {
    setSavingId(adminId);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch(`/api/admin/admin-users/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "更新に失敗しました。");
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === adminId
            ? {
                ...a,
                ...patch,
                email: data.user?.email ?? patch.email ?? a.email,
                displayName: data.user?.displayName ?? patch.displayName ?? a.displayName,
              }
            : a
        )
      );
      setStatus({ type: "success", text: "設定を保存しました。" });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSavingId("");
    }
  }

  async function sendInvite(e) {
    e.preventDefault();
    setInviteSending(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/role-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: inviteRole,
          email: inviteEmail,
          displayName: inviteName,
          studentId: inviteRole === "parent" ? inviteStudentId : "",
          relationship: inviteRole === "parent" ? inviteRelationship : "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "招待に失敗しました。");
      const line = data.mailWarning
        ? `${data.mailWarning} / URL: ${data.inviteUrl || ""}`
        : `招待を作成しました。${data.inviteUrl ? ` URL: ${data.inviteUrl}` : ""}`;
      setStatus({ type: data.mailWarning ? "error" : "success", text: line });
      setInviteEmail("");
      setInviteStudentId("");
      await reloadInvites();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setInviteSending(false);
    }
  }

  return (
    <>
      {status.text ? (
        <p
          className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}
          style={{ marginTop: "0.5rem" }}
        >
          {status.text}
        </p>
      ) : null}

      <div className={adminStyles.accountEditorList}>
        {admins.map((admin) => (
          <AdminUserPanel
            key={admin.id}
            admin={admin}
            isSuper={isSuper}
            saving={savingId === admin.id}
            onSave={(patch) => saveAdmin(admin.id, patch)}
          />
        ))}
      </div>

      <div className={adminStyles.sectionBlock} style={{ marginTop: "1.35rem" }}>
        <h3 className={adminStyles.groupTitle}>講師 / 保護者の招待</h3>
        <p className={adminStyles.smallMuted}>招待リンク経由で役割が固定されます。保護者は学生IDと続柄が必要です。</p>
        <form className={adminStyles.compactFormGrid} onSubmit={sendInvite}>
          <label className={styles.label}>
            役割
            <select className={styles.field} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              <option value="teacher">講師</option>
              <option value="parent">保護者</option>
            </select>
          </label>
          <label className={styles.label}>
            メール
            <input className={styles.field} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
          </label>
          <label className={styles.label}>
            表示名（任意）
            <input className={styles.field} value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
          </label>
          {inviteRole === "parent" ? (
            <>
              <label className={styles.label}>
                学生ID
                <input className={styles.field} value={inviteStudentId} onChange={(e) => setInviteStudentId(e.target.value)} required />
              </label>
              <label className={styles.label}>
                続柄
                <input className={styles.field} value={inviteRelationship} onChange={(e) => setInviteRelationship(e.target.value)} />
              </label>
            </>
          ) : null}
          <button className={styles.button} type="submit" disabled={inviteSending}>
            {inviteSending ? "送信中..." : "招待メール送信"}
          </button>
        </form>

        <h4 className={adminStyles.groupTitle} style={{ marginTop: "1rem" }}>
          保留中の招待
        </h4>
        <ul className={adminStyles.tableLike}>
          {invites.length === 0 ? <li>なし</li> : null}
          {invites.map((inv) => (
            <li key={inv.id}>
              {inv.role} / {inv.email} / 期限 {String(inv.expiresAt || "").slice(0, 16)}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function AdminUserPanel({ admin, isSuper, saving, onSave }) {
  const [displayName, setDisplayName] = useState(admin.displayName || "");
  const [email, setEmail] = useState(admin.email || "");
  const [phone, setPhone] = useState(admin.phone || "");
  const [nameFurigana, setNameFurigana] = useState(admin.nameFurigana || "");
  const [jobTitle, setJobTitle] = useState(admin.jobTitle || "");
  const [signatureNote, setSignatureNote] = useState(admin.signatureNote || "");
  const [profileImageDataUrl, setProfileImageDataUrl] = useState(admin.profileImageDataUrl || "");
  const [statusVal, setStatusVal] = useState(admin.status || "active");
  const [rank, setRank] = useState(admin.adminRank || "ADMIN");
  const fileRef = useRef(null);

  const applyFromAdmin = useCallback(() => {
    setDisplayName(admin.displayName || "");
    setEmail(admin.email || "");
    setPhone(admin.phone || "");
    setNameFurigana(admin.nameFurigana || "");
    setJobTitle(admin.jobTitle || "");
    setSignatureNote(admin.signatureNote || "");
    setProfileImageDataUrl(admin.profileImageDataUrl || "");
    setStatusVal(admin.status || "active");
    setRank(admin.adminRank || "ADMIN");
    if (fileRef.current) fileRef.current.value = "";
  }, [admin]);

  useEffect(() => {
    applyFromAdmin();
  }, [applyFromAdmin]);

  function onPickImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください。");
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      alert(`画像はおおよそ ${Math.round(PROFILE_IMAGE_MAX_BYTES / 1024)}KB 以下にしてください。`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileImageDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function buildPatch() {
    return {
      displayName,
      email,
      phone,
      nameFurigana,
      jobTitle,
      signatureNote,
      profileImageDataUrl,
      status: statusVal,
      adminRank: rank,
    };
  }

  const rankLabel = rank === "SUPER_ADMIN" ? "スーパー管理者" : "管理者";

  return (
    <div className={adminStyles.accountPermissionsLayout}>
      <div className={adminStyles.accountPermissionsMain}>
        <div className={adminStyles.accountEditorHead} style={{ borderBottom: "none", marginBottom: "0.35rem", paddingBottom: 0 }}>
          <div>
            <p className={adminStyles.smallMuted} style={{ marginBottom: "0.2rem" }}>
              管理者 ID: {admin.id}
            </p>
            <p className={adminStyles.accountEditorTitle}>{displayName || email || "（名前未設定）"}</p>
          </div>
        </div>

        {/* A 基本情報 */}
        <section className={adminStyles.settingsSectionCard} aria-labelledby={`basic-${admin.id}`}>
          <h3 id={`basic-${admin.id}`} className={adminStyles.settingsSectionHeading}>
            基本情報
          </h3>
          <p className={adminStyles.settingsSectionLead}>連絡先と表示に使う名前、役職、およびこのアカウントの利用状態です。</p>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>
              表示名
              <input className={styles.field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
            <label className={styles.label}>
              メール
              <input className={styles.field} value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isSuper} />
            </label>
            <label className={styles.label}>
              電話番号
              <input className={styles.field} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className={styles.label}>
              役職
              <input className={styles.field} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="例）教室長" />
            </label>
            <label className={styles.label}>
              状態
              <select className={styles.field} value={statusVal} onChange={(e) => setStatusVal(e.target.value)} disabled={!isSuper}>
                <option value="active">active（利用中）</option>
                <option value="inactive">inactive（利用停止）</option>
              </select>
            </label>
            <label className={styles.label}>
              フリガナ（任意）
              <input className={styles.field} value={nameFurigana} onChange={(e) => setNameFurigana(e.target.value)} />
            </label>
          </div>
          {!isSuper ? (
            <p className={adminStyles.fieldHint}>メール・利用状態の変更はスーパー管理者のみ行えます。</p>
          ) : null}
          <div className={adminStyles.readOnlyField}>
            <span className={adminStyles.readOnlyLabel}>最終ログイン</span>
            <span className={adminStyles.readOnlyValue}>{formatLastLoginJa(admin.lastLoginAt)}</span>
          </div>
        </section>

        {/* B 権限・アカウント */}
        <section className={adminStyles.settingsSectionCard} aria-labelledby={`perm-${admin.id}`}>
          <h3 id={`perm-${admin.id}`} className={adminStyles.settingsSectionHeading}>
            権限とアカウントの安全
          </h3>
          <p className={adminStyles.settingsSectionLead}>操作できる範囲が変わります。権限を上げる場合は、対象者が信頼できる方か確認してください。</p>
          <div className={adminStyles.compactFormGrid}>
            <label className={styles.label}>
              権限
              <select className={styles.field} value={rank} onChange={(e) => setRank(e.target.value)} disabled={!isSuper}>
                <option value="ADMIN">ADMIN（通常の管理者）</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN（スーパー管理者）</option>
              </select>
            </label>
            <div className={adminStyles.readOnlyField}>
              <span className={adminStyles.readOnlyLabel}>アカウント状態</span>
              <span className={adminStyles.readOnlyValue}>{accountStatusJa(statusVal)}（{statusVal}）</span>
            </div>
          </div>
          {!isSuper ? <p className={adminStyles.fieldHint}>権限レベルの変更はスーパー管理者のみ行えます。</p> : null}
          <div className={adminStyles.passwordActionRow}>
            <button type="button" className={adminStyles.settingsButtonMuted} disabled>
              パスワードを再設定
            </button>
            <span className={adminStyles.passwordActionNote}>この画面からのパスワード再設定は準備中です。お急ぎの場合は別途ご連絡ください。</span>
          </div>
          <p className={adminStyles.accountCaution}>
            権限や利用状態を変更したあと、必ず保存ボタンで確定してください。誤った設定は予約や請求の操作に影響することがあります。
          </p>
        </section>

        {/* C 発信者情報 */}
        <section className={adminStyles.settingsSectionCard} aria-labelledby={`sender-${admin.id}`}>
          <h3 id={`sender-${admin.id}`} className={adminStyles.settingsSectionHeading}>
            発信者情報（メール・通知）
          </h3>
          <p className={adminStyles.settingsSectionLead}>
            通知やメール本文に載せたい署名・顔写真を登録できます。選択した画像はシステム内に保存されます（サイズ上限あり）。将来的に送信者表示と連携しやすい形で保持します。
          </p>
          <div className={adminStyles.senderUploadRow}>
            <div className={adminStyles.profileAvatarFrame} style={{ maxWidth: 96 }}>
              {profileImageDataUrl ? (
                <img src={profileImageDataUrl} alt="" className={adminStyles.profileAvatarImg} />
              ) : (
                <span className={adminStyles.profileAvatarPlaceholder}>未設定</span>
              )}
            </div>
            <div className={adminStyles.senderUploadFields}>
              <label className={styles.label}>
                プロフィール画像
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className={adminStyles.profileFileInput}
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                />
              </label>
              <button
                type="button"
                className={adminStyles.inlineLinkButton}
                onClick={() => {
                  setProfileImageDataUrl("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                画像をクリア
              </button>
            </div>
          </div>
          <label className={styles.label}>
            署名
            <textarea
              className={styles.field}
              rows={4}
              value={signatureNote}
              onChange={(e) => setSignatureNote(e.target.value)}
              placeholder={"MalMoi韓国語教室\n担当：山田 太郎\n（お問い合わせはメールにて）"}
            />
          </label>
          <div className={adminStyles.senderPreviewBox} aria-live="polite">
            <p className={adminStyles.senderPreviewTitle}>送信者イメージ（参考表示）</p>
            <div className={adminStyles.senderPreviewInner}>
              <div className={adminStyles.profileAvatarFrame} style={{ maxWidth: 48, minHeight: 48 }}>
                {profileImageDataUrl ? (
                  <img src={profileImageDataUrl} alt="" className={adminStyles.profileAvatarImg} />
                ) : (
                  <span className={adminStyles.profileAvatarPlaceholder} style={{ fontSize: "0.55rem" }}>
                    —
                  </span>
                )}
              </div>
              <div className={adminStyles.senderPreviewText}>
                <p className={adminStyles.senderPreviewName}>{displayName || "（表示名）"}</p>
                {jobTitle ? <p className={adminStyles.senderPreviewRole}>{jobTitle}</p> : null}
                <p className={adminStyles.senderPreviewSig}>
                  {signatureNote
                    ? signatureNote.split("\n").slice(0, 5).join("\n") || "（署名なし）"
                    : "（署名が未入力のときの見え方の例です）"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className={adminStyles.settingsFormActions}>
          <button className={styles.button} type="button" disabled={saving} onClick={() => onSave(buildPatch())}>
            {saving ? "保存中..." : "保存"}
          </button>
          <button className={adminStyles.settingsButtonSecondary} type="button" disabled={saving} onClick={applyFromAdmin}>
            変更を元に戻す
          </button>
        </div>
      </div>

      <aside className={adminStyles.accountPermissionsAside} aria-label="登録確認サマリー">
        <div className={adminStyles.registrationAuxCardCompact}>
          <h4 className={adminStyles.registrationAuxTitle}>登録確認</h4>
          <p className={adminStyles.smallMuted}>編集中の内容をざっと確認できます。学生の本登録フローはリンク先で操作してください。</p>
          <dl className={adminStyles.registrationSummaryDl}>
            <div>
              <dt>メール</dt>
              <dd>{email || "—"}</dd>
            </div>
            <div>
              <dt>電話</dt>
              <dd>{phone || "—"}</dd>
            </div>
            <div>
              <dt>権限</dt>
              <dd>{rankLabel}</dd>
            </div>
            <div>
              <dt>状態</dt>
              <dd>
                {accountStatusJa(statusVal)} <span className={adminStyles.smallMuted}>({statusVal})</span>
              </dd>
            </div>
            <div>
              <dt>最終ログイン</dt>
              <dd>{formatLastLoginJa(admin.lastLoginAt)}</dd>
            </div>
          </dl>
          <div className={adminStyles.inlineLinks} style={{ marginTop: "0.5rem" }}>
            <Link className={adminStyles.inlineLink} href="/admin/students">
              学生管理へ
            </Link>
            <Link className={adminStyles.inlineLink} href="/admin/mail">
              メール管理へ
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

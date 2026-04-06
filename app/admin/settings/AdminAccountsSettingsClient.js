"use client";

import { useState } from "react";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";

export default function AdminAccountsSettingsClient({ initialAdmins = [], initialInvites = [], adminRank = "ADMIN" }) {
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
                email: data.user?.email || patch.email || a.email,
                displayName: data.user?.displayName || patch.displayName || a.displayName,
              }
            : a
        )
      );
      setStatus({ type: "success", text: "管理者情報を更新しました。" });
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
    <div className={adminStyles.sectionBlock}>
      <h3 className={adminStyles.groupTitle}>管理者アカウント</h3>
      {status.text ? (
        <p className={status.type === "error" ? `${styles.message} ${styles.messageError}` : styles.message}>{status.text}</p>
      ) : null}
      <div className={styles.links}>
        {admins.map((admin) => (
          <AdminRow
            key={admin.id}
            admin={admin}
            isSuper={isSuper}
            saving={savingId === admin.id}
            onSave={(patch) => saveAdmin(admin.id, patch)}
          />
        ))}
      </div>

      <h3 className={adminStyles.groupTitle} style={{ marginTop: "1.25rem" }}>
        講師 / 保護者の招待
      </h3>
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
  );
}

function AdminRow({ admin, isSuper, saving, onSave }) {
  const [displayName, setDisplayName] = useState(admin.displayName || "");
  const [email, setEmail] = useState(admin.email || "");
  const [phone, setPhone] = useState(admin.phone || "");
  const [nameFurigana, setNameFurigana] = useState(admin.nameFurigana || "");
  const [jobTitle, setJobTitle] = useState(admin.jobTitle || "");
  const [signatureNote, setSignatureNote] = useState(admin.signatureNote || "");
  const [profileImageDataUrl, setProfileImageDataUrl] = useState(admin.profileImageDataUrl || "");
  const [statusVal, setStatusVal] = useState(admin.status || "active");
  const [rank, setRank] = useState(admin.adminRank || "ADMIN");

  return (
    <div className={styles.infoCard} style={{ textAlign: "left" }}>
      <p className={adminStyles.smallMuted}>ID: {admin.id}</p>
      <div className={adminStyles.compactFormGrid}>
        <label className={styles.label}>
          表示名
          <input className={styles.field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className={styles.label}>
          メール{!isSuper ? "（SUPERのみ変更）" : ""}
          <input className={styles.field} value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isSuper} />
        </label>
        <label className={styles.label}>
          電話
          <input className={styles.field} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className={styles.label}>
          フリガナ
          <input className={styles.field} value={nameFurigana} onChange={(e) => setNameFurigana(e.target.value)} />
        </label>
        <label className={styles.label}>
          役職 / 肩書
          <input className={styles.field} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </label>
        <label className={styles.label}>
          署名メモ
          <input className={styles.field} value={signatureNote} onChange={(e) => setSignatureNote(e.target.value)} />
        </label>
        <label className={styles.label}>
          状態{!isSuper ? "（SUPERのみ）" : ""}
          <select className={styles.field} value={statusVal} onChange={(e) => setStatusVal(e.target.value)} disabled={!isSuper}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <label className={styles.label}>
          権限{!isSuper ? "（SUPERのみ）" : ""}
          <select className={styles.field} value={rank} onChange={(e) => setRank(e.target.value)} disabled={!isSuper}>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </label>
      </div>
      <label className={styles.label}>
        プロフィール画像 (data URL)
        <textarea className={styles.field} rows={2} value={profileImageDataUrl} onChange={(e) => setProfileImageDataUrl(e.target.value)} />
      </label>
      <button
        className={styles.button}
        type="button"
        disabled={saving}
        onClick={() =>
          onSave({
            displayName,
            email,
            phone,
            nameFurigana,
            jobTitle,
            signatureNote,
            profileImageDataUrl,
            status: statusVal,
            adminRank: rank,
          })
        }
      >
        {saving ? "保存中..." : "保存"}
      </button>
    </div>
  );
}

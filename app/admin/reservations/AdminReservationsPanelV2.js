"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";
import adminStyles from "../admin.module.css";
import v2 from "./admin-reservations-v2.module.css";

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function statusLabel(status) {
  const map = {
    requested: "承認待ち",
    confirmed: "承認済み",
    change_requested: "変更対応中",
    rejected: "却下",
    scheduled: "再調整待ち",
    cancelled: "キャンセル",
    completed: "完了",
  };
  return map[String(status || "").trim()] || String(status || "-");
}

function deliveryLabel(item) {
  return String(item.lessonDeliveryType || "") === "online" ? "オンライン" : "対面";
}

function sortableKey(item) {
  return `${item.date || ""} ${item.time || ""}`;
}

export default function AdminReservationsPanelV2({ initialReservations = [], initialFilters = {}, scopeNotice = "" }) {
  const [fromDate, setFromDate] = useState(initialFilters.fromDate || todayIso());
  const [toDate, setToDate] = useState(initialFilters.toDate || initialFilters.fromDate || todayIso());
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || "");
  const [query, setQuery] = useState(initialFilters.q || "");
  const [reservations, setReservations] = useState(initialReservations);
  const [slots, setSlots] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slotBusyId, setSlotBusyId] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    mode: "single",
    slotId: "",
    studentId: "",
    studentAId: "",
    studentBId: "",
    lessonDeliveryType: "in_person",
    memo: "",
  });

  const filtered = useMemo(() => {
    return [...reservations]
      .filter((item) => (statusFilter ? item.status === statusFilter : true))
      .filter((item) => {
        const q = String(query || "").trim().toLowerCase();
        if (!q) return true;
        const hay = [
          item.studentNameKanji,
          item.studentNameFurigana,
          item.studentNumber,
          item.studentEmail,
          item.instructorName,
          item.memo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => sortableKey(a).localeCompare(sortableKey(b)));
  }, [reservations, statusFilter, query]);

  const slotOptions = useMemo(
    () =>
      [...slots]
        .filter((s) => s.status === "open")
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [slots]
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const rp = new URLSearchParams();
      rp.set("fromDate", fromDate);
      rp.set("toDate", toDate);
      rp.set("page", "1");
      rp.set("pageSize", "500");
      const sp = new URLSearchParams();
      sp.set("fromDate", fromDate);
      sp.set("toDate", fromDate);
      const [rRes, sRes, stRes] = await Promise.all([
        fetch(`/api/admin/reservations?${rp.toString()}`, { cache: "no-store" }),
        fetch(`/api/admin/reservation-slots?${sp.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/students?page=1&pageSize=400", { cache: "no-store" }),
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      const stData = await stRes.json();
      if (!rRes.ok || !rData?.ok) throw new Error(rData?.error || "予約一覧の取得に失敗しました。");
      if (!sRes.ok || !sData?.ok) throw new Error(sData?.error || "スロット取得に失敗しました。");
      if (!stRes.ok || !stData?.ok) throw new Error(stData?.error || "学生一覧の取得に失敗しました。");
      setReservations(rData.reservations || []);
      setSlots(sData.slots || []);
      setStudents(stData.students || []);
      setSelected((prev) => {
        if (!prev) return null;
        return (rData.reservations || []).find((x) => x.id === prev.id) || null;
      });
    } catch (e) {
      setError(e.message || "読み込みエラー");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  async function updateReservation(id, patch) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "更新に失敗しました。");
      await load();
      return true;
    } catch (e) {
      setError(e.message || "更新エラー");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function patchSlot(slotId, body) {
    setSlotBusyId(slotId);
    setError("");
    try {
      const response = await fetch(`/api/admin/reservation-slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "スロット更新に失敗しました。");
      await load();
    } catch (e) {
      setError(e.message || "スロット更新エラー");
    } finally {
      setSlotBusyId("");
    }
  }

  async function createReservation() {
    setSaving(true);
    setError("");
    try {
      const payload =
        createForm.mode === "pair"
          ? {
              mode: "pair",
              slotId: createForm.slotId,
              studentAId: createForm.studentAId,
              studentBId: createForm.studentBId,
              lessonDeliveryType: createForm.lessonDeliveryType,
              memo: createForm.memo,
            }
          : {
              mode: "single",
              slotId: createForm.slotId,
              studentId: createForm.studentId,
              lessonDeliveryType: createForm.lessonDeliveryType,
              memo: createForm.memo,
            };
      const response = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "予約追加に失敗しました。");
      setOpenCreate(false);
      setCreateForm({
        mode: "single",
        slotId: "",
        studentId: "",
        studentAId: "",
        studentBId: "",
        lessonDeliveryType: "in_person",
        memo: "",
      });
      await load();
    } catch (e) {
      setError(e.message || "作成エラー");
    } finally {
      setSaving(false);
    }
  }

  function openRow(item) {
    setSelected(item);
    setDrawerOpen(true);
  }

  return (
    <section>
      {scopeNotice ? <p className={styles.description}>{scopeNotice}</p> : null}
      <p className={v2.hint}>
        詳細なスケジュールビューや一括操作は{" "}
        <Link href="/admin/reservations?ui=v1" prefetch={false}>
          従来の予約画面
        </Link>
        をご利用ください。
      </p>

      <div className={v2.toolbar}>
        <label className={styles.label}>
          開始日
          <input className={styles.field} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className={styles.label}>
          終了日
          <input className={styles.field} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <label className={styles.label}>
          状態
          <select className={styles.field} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">すべて</option>
            <option value="requested">承認待ち</option>
            <option value="confirmed">承認済み</option>
            <option value="change_requested">変更対応中</option>
            <option value="rejected">却下</option>
            <option value="cancelled">キャンセル</option>
            <option value="completed">完了</option>
          </select>
        </label>
        <label className={styles.label} style={{ flex: 2, minWidth: "12rem" }}>
          学生検索
          <input
            className={styles.field}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="氏名・フリガナ・学生番号・メール"
          />
        </label>
        <button className={styles.button} type="button" onClick={() => setOpenCreate(true)}>
          予約追加
        </button>
        <button className={adminStyles.chipButton} type="button" onClick={load} disabled={loading}>
          再読込
        </button>
      </div>

      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {loading ? <p className={styles.description}>読み込み中...</p> : null}

      <div className={v2.listWrap}>
        <div className={v2.th} aria-hidden>
          <span>日付</span>
          <span>時間</span>
          <span>学生</span>
          <span>状態</span>
          <span>操作</span>
        </div>
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`${v2.row} ${selected?.id === item.id ? v2.rowActive : ""}`}
            onClick={() => openRow(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openRow(item);
            }}
          >
            <span>{item.date}</span>
            <span>{item.time}</span>
            <span>
              {item.studentNameKanji || "-"}
              <span className={adminStyles.smallMuted}> / {item.studentNumber || "-"}</span>
            </span>
            <span>{statusLabel(item.status)}</span>
            <span>
              <button
                type="button"
                className={adminStyles.inlineLinkButton}
                onClick={(e) => {
                  e.stopPropagation();
                  openRow(item);
                }}
              >
                詳細
              </button>
            </span>
          </div>
        ))}
        {!loading && filtered.length === 0 ? <p className={styles.description} style={{ padding: "1rem" }}>該当なし</p> : null}
      </div>

      <div className={v2.safeZone}>
        <h3 className={v2.safeZoneTitle}>スロット開閉（基準日: {fromDate}）</h3>
        <p className={styles.description}>
          開閉は予約枠に直接影響します。誤操作にご注意ください。スロット再生成は従来画面から実行してください。
        </p>
        {slots.length === 0 ? <p className={v2.hint}>この日付のスロットがありません。</p> : null}
        {slots.map((slot) => (
          <div key={slot.id} className={v2.slotRow}>
            <span>
              {slot.time} / {slot.lessonMode || "-"} / 残{slot.availableCount ?? "-"}
            </span>
            <span className={adminStyles.smallMuted}>{slot.status === "open" ? "開" : "閉"}</span>
            <button
              type="button"
              className={adminStyles.chipButton}
              disabled={slotBusyId === slot.id || slot.status !== "open"}
              onClick={() => patchSlot(slot.id, { status: "closed" })}
            >
              閉じる
            </button>
            <button
              type="button"
              className={adminStyles.chipButton}
              disabled={slotBusyId === slot.id || slot.status === "open"}
              onClick={() => patchSlot(slot.id, { status: "open" })}
            >
              開く
            </button>
          </div>
        ))}
      </div>

      <div className={`${v2.drawer} ${drawerOpen ? v2.drawerOpen : ""}`}>
        <button
          type="button"
          className={v2.drawerBackdrop}
          aria-label="閉じる"
          onClick={() => setDrawerOpen(false)}
        />
        <aside className={v2.drawerPanel}>
          {!selected ? (
            <p className={adminStyles.smallMuted}>行を選択してください</p>
          ) : (
            <>
              <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>
                予約詳細
              </h3>
              <p>
                <strong>{selected.date}</strong> {selected.time}
              </p>
              <p>学生: {selected.studentNameKanji || "-"}</p>
              <p>状態: {statusLabel(selected.status)}</p>
              <p>形式: {deliveryLabel(selected)}</p>
              <p>講師: {selected.instructorName || "-"}</p>
              <p>メモ: {selected.memo || "-"}</p>
              <div className={adminStyles.compactActions} style={{ flexDirection: "column", alignItems: "stretch" }}>
                {(selected.status === "requested" || selected.status === "change_requested") && (
                  <>
                    <button
                      className={styles.button}
                      type="button"
                      disabled={saving}
                      onClick={() => updateReservation(selected.id, { status: "confirmed" })}
                    >
                      承認
                    </button>
                    <button
                      className={styles.button}
                      type="button"
                      disabled={saving}
                      onClick={() => updateReservation(selected.id, { status: "rejected" })}
                    >
                      却下
                    </button>
                  </>
                )}
                {selected.status === "confirmed" && (
                  <>
                    <button
                      className={styles.button}
                      type="button"
                      disabled={saving}
                      onClick={() => updateReservation(selected.id, { status: "completed" })}
                    >
                      完了にする
                    </button>
                    <button
                      className={styles.button}
                      type="button"
                      disabled={saving}
                      onClick={() => updateReservation(selected.id, { status: "cancelled" })}
                    >
                      キャンセル
                    </button>
                  </>
                )}
                <a className={adminStyles.actionButton} href={`/admin/students/${selected.studentId}`}>
                  学生詳細
                </a>
              </div>
            </>
          )}
        </aside>
      </div>

      {openCreate ? (
        <div className={adminStyles.modalOverlay}>
          <div className={adminStyles.modalCard}>
            <h3 className={styles.sectionTitle}>予約追加</h3>
            <label className={styles.label}>
              タイプ
              <select
                className={styles.field}
                value={createForm.mode}
                onChange={(e) => setCreateForm((p) => ({ ...p, mode: e.target.value }))}
              >
                <option value="single">単一</option>
                <option value="pair">ペア</option>
              </select>
            </label>
            <label className={styles.label}>
              スロット
              <select
                className={styles.field}
                value={createForm.slotId}
                onChange={(e) => setCreateForm((p) => ({ ...p, slotId: e.target.value }))}
              >
                <option value="">選択</option>
                {slotOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} {s.time} / 残{s.availableCount}
                  </option>
                ))}
              </select>
            </label>
            {createForm.mode === "pair" ? (
              <>
                <label className={styles.label}>
                  学生A
                  <select
                    className={styles.field}
                    value={createForm.studentAId}
                    onChange={(e) => setCreateForm((p) => ({ ...p, studentAId: e.target.value }))}
                  >
                    <option value="">選択</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameKanji}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  学生B
                  <select
                    className={styles.field}
                    value={createForm.studentBId}
                    onChange={(e) => setCreateForm((p) => ({ ...p, studentBId: e.target.value }))}
                  >
                    <option value="">選択</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameKanji}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label className={styles.label}>
                学生
                <select
                  className={styles.field}
                  value={createForm.studentId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, studentId: e.target.value }))}
                >
                  <option value="">選択</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameKanji}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.label}>
              レッスン形式
              <select
                className={styles.field}
                value={createForm.lessonDeliveryType}
                onChange={(e) => setCreateForm((p) => ({ ...p, lessonDeliveryType: e.target.value }))}
              >
                <option value="in_person">対面</option>
                <option value="online">オンライン</option>
              </select>
            </label>
            <label className={styles.label}>
              メモ
              <input
                className={styles.field}
                value={createForm.memo}
                onChange={(e) => setCreateForm((p) => ({ ...p, memo: e.target.value }))}
              />
            </label>
            <div className={adminStyles.compactActions}>
              <button className={styles.button} type="button" disabled={saving} onClick={createReservation}>
                保存
              </button>
              <button className={styles.button} type="button" onClick={() => setOpenCreate(false)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cancelAdminReservation,
  fetchAdminAuditLogs,
  patchAdminReservation,
} from "../../adapters/adminReservationsAdapter";
import ReservationStatusBadge from "./ReservationStatusBadge";
import ReservationMetaBlock from "./ReservationMetaBlock";
import ReservationActionBar from "./ReservationActionBar";
import ReservationChangeDialog from "./ReservationChangeDialog";
import ReservationCancelDialog from "./ReservationCancelDialog";
import ReservationHistoryList from "./ReservationHistoryList";
import ui from "./reservation-detail-panel.module.css";

function weekdayJa(ymd) {
  const d = new Date(`${String(ymd || "").slice(0, 10)}T00:00:00`);
  const arr = ["日", "月", "火", "水", "木", "金", "土"];
  return Number.isNaN(d.getTime()) ? "-" : arr[d.getDay()];
}

function clockEnd(reservation) {
  const t = String(reservation?.time || "09:00").slice(0, 5);
  const [h, m] = t.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "—";
  const sum = h * 60 + m + Math.max(15, Number(reservation?.durationMinutes || 60));
  return `${String(Math.floor(sum / 60) % 24).padStart(2, "0")}:${String(sum % 60).padStart(2, "0")}`;
}

function actorLabel(role) {
  const r = String(role || "").trim();
  if (r === "admin") return "管理者";
  if (r === "student") return "学生";
  if (r === "teacher") return "先生";
  return r || "不明";
}

export default function ReservationDetailPanel({
  reservation,
  teachers = [],
  slots = [],
  onUpdated,
  onOpenCreateForStudent,
  noteMissing = false,
  rangeFrom = "",
  rangeTo = "",
}) {
  const [busy, setBusy] = useState(false);
  const [memoDraft, setMemoDraft] = useState("");
  const [openChange, setOpenChange] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setMemoDraft(String(reservation?.memo || ""));
  }, [reservation?.id, reservation?.memo]);

  useEffect(() => {
    let cancelled = false;
    async function loadLogs() {
      if (!reservation?.id) return;
      try {
        const data = await fetchAdminAuditLogs({
          targetType: "reservation",
          fromDate: rangeFrom || reservation.date,
          toDate: rangeTo || reservation.date,
          page: 1,
          pageSize: 120,
        });
        const hit = (data.logs || []).filter((l) => String(l.targetId || "") === String(reservation.id));
        if (!cancelled) setLogs(hit);
      } catch {
        if (!cancelled) setLogs([]);
      }
    }
    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [reservation?.id, reservation?.date, rangeFrom, rangeTo]);

  const usageRows = useMemo(() => {
    if (!reservation) return [];
    const consumeMinutes = Number(reservation.durationMinutes || 0);
    const consumePt = Number(reservation.pointsCharged ?? reservation.expectedPointsConsume ?? 0);
    return [
      { k: "今回消費時間", v: `${consumeMinutes || "-"}分` },
      { k: "今回消費ポイント", v: `${consumePt || 0}pt` },
      { k: "予約前残時間", v: "保存ログ基準で計算" },
      { k: "予約後想定残時間", v: "保存ログ基準で計算" },
    ];
  }, [reservation]);

  const historyItems = useMemo(() => {
    const h1 = (reservation?.history || []).map((h, idx) => ({ ...h, id: h.id || `h-${idx}` }));
    const h2 = (logs || []).map((l) => ({
      id: l.id,
      action: l.action?.replace("reservation.", ""),
      at: l.at,
      actorRole: l.actorRole,
      summary: l.summary,
    }));
    return [...h2, ...h1]
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
      .slice(0, 20);
  }, [reservation?.history, logs]);

  async function saveMemo() {
    if (!reservation?.id) return;
    setBusy(true);
    try {
      await patchAdminReservation(reservation.id, { memo: memoDraft });
      if (typeof onUpdated === "function") await onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function saveChange(next) {
    if (!reservation?.id) return;
    setBusy(true);
    try {
      await patchAdminReservation(reservation.id, {
        ...(next.date ? { date: next.date } : {}),
        ...(next.slotId ? { slotId: next.slotId } : {}),
        lessonDeliveryType: next.lessonDeliveryType,
        memo: next.memo,
      });
      setOpenChange(false);
      if (typeof onUpdated === "function") await onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancel(reason) {
    if (!reservation?.id) return;
    setBusy(true);
    try {
      await cancelAdminReservation(reservation.id, { memo: reason });
      setOpenCancel(false);
      if (typeof onUpdated === "function") await onUpdated();
    } finally {
      setBusy(false);
    }
  }

  if (!reservation) {
    return <p className={ui.subline}>予約を選択すると詳細と操作を表示します。</p>;
  }

  return (
    <section className={ui.panel}>
      <div className={ui.head}>
        <h3 className={ui.title}>{reservation.studentNameKanji || "—"}</h3>
        <div className={ui.chips}>
          <ReservationStatusBadge status={reservation.status} />
          {noteMissing ? <span className={`${ui.status} ${ui.pending}`}>未完了ノートあり</span> : null}
          <span className={ui.chip}>{reservation.durationMinutes || "—"}分</span>
          <span className={ui.chip}>
            {String(reservation.lessonDeliveryType || "in_person") === "online" ? "オンライン" : "対面"}
          </span>
        </div>
        <div className={ui.subline}>
          {reservation.date}（{weekdayJa(reservation.date)}） {String(reservation.time || "").slice(0, 5)} - {clockEnd(reservation)}
        </div>
        <div className={ui.subline}>
          {reservation.lessonServiceNameJa || "レッスン"} / 担当: {reservation.instructorName || "未設定"}
        </div>
      </div>

      <ReservationMetaBlock
        title="基本情報"
        rows={[
          { k: "学生名", v: reservation.studentNameKanji || "-" },
          { k: "フリガナ", v: reservation.studentNameFurigana || "-" },
          { k: "学生番号", v: reservation.studentNumber || "-" },
          { k: "講師名", v: reservation.instructorName || "-" },
          { k: "レッスン名", v: reservation.lessonServiceNameJa || "-" },
          { k: "作成主体", v: actorLabel(reservation.createdByRole) },
          { k: "作成日時", v: String(reservation.createdAt || "-").replace("T", " ").slice(0, 16) },
          { k: "更新日時", v: String(reservation.updatedAt || "-").replace("T", " ").slice(0, 16) },
        ]}
      />

      <ReservationMetaBlock title="利用情報" rows={usageRows} />

      <section className={ui.block}>
        <h4 className={ui.blockTitle}>変更履歴 / ログ</h4>
        <ReservationHistoryList items={historyItems} />
      </section>

      <ReservationActionBar
        reservation={reservation}
        memoDraft={memoDraft}
        setMemoDraft={setMemoDraft}
        onOpenChange={() => setOpenChange(true)}
        onOpenCancel={() => setOpenCancel(true)}
        onSaveMemo={saveMemo}
        onOpenCreateForStudent={onOpenCreateForStudent}
        busy={busy}
      />

      <ReservationChangeDialog
        open={openChange}
        reservation={reservation}
        teachers={teachers}
        slots={slots}
        busy={busy}
        onClose={() => setOpenChange(false)}
        onConfirm={saveChange}
      />
      <ReservationCancelDialog
        open={openCancel}
        reservation={reservation}
        busy={busy}
        onClose={() => setOpenCancel(false)}
        onConfirm={confirmCancel}
      />
    </section>
  );
}

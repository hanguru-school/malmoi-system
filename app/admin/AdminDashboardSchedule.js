"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDaysYmd,
  listDaysInclusive,
  startOfWeekMondayIso,
} from "../../lib/admin/reservationCalendarModel.js";
import ReservationDetailPanel from "../../features/reservations/ui/admin/ReservationDetailPanel";
import ds from "./admin-dashboard-schedule.module.css";

function eventClass(status) {
  const s = String(status || "").trim();
  if (s === "confirmed" || s === "completed") return ds.evConfirmed;
  if (s === "requested") return ds.evRequested;
  if (s === "change_requested" || s === "scheduled") return ds.evAttention;
  if (s === "cancelled" || s === "rejected") return ds.evCancelled;
  return ds.evOther;
}

export default function AdminDashboardSchedule({ todayYmd, reservations = [] }) {
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [slots, setSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const weekStart = useMemo(() => startOfWeekMondayIso(todayYmd), [todayYmd]);
  const weekEnd = useMemo(() => addDaysYmd(weekStart, 6), [weekStart]);
  const weekDays = useMemo(() => listDaysInclusive(weekStart, addDaysYmd(weekStart, 6)), [weekStart]);

  const byDate = useMemo(() => {
    const m = new Map();
    weekDays.forEach((d) => m.set(d, []));
    (reservations || []).forEach((r) => {
      const d = String(r.date || "").slice(0, 10);
      if (!m.has(d)) return;
      m.get(d).push(r);
    });
    m.forEach((arr, k) => {
      arr.sort((a, b) => `${a.time || ""}`.localeCompare(`${b.time || ""}`));
      m.set(k, arr);
    });
    return m;
  }, [reservations, weekDays]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/reservation-slots?fromDate=${weekStart}&toDate=${weekEnd}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && data?.ok) {
          setSlots(data.slots || []);
          setTeachers(data.teachers || []);
        }
      } catch {
        if (!cancelled) {
          setSlots([]);
          setTeachers([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weekStart, weekEnd]);

  const weekdayJa = ["月", "火", "水", "木", "金", "土", "日"];

  return (
    <section className={ds.wrap} aria-label="今週の予定">
      <div className={ds.head}>
        <div>
          <h2 className={ds.title}>本日・今週のレッスン予定</h2>
          <p className={ds.sub}>
            基準日 {todayYmd}（週 {weekStart} 〜 {addDaysYmd(weekStart, 6)}）· タップで詳細
          </p>
        </div>
        <div className={ds.legend} aria-hidden>
          <span className={ds.legendItem}>
            <span className={`${ds.dot} ${ds.dotConfirmed}`} /> 確定
          </span>
          <span className={ds.legendItem}>
            <span className={`${ds.dot} ${ds.dotRequested}`} /> 仮予約
          </span>
          <span className={ds.legendItem}>
            <span className={`${ds.dot} ${ds.dotAttention}`} /> 要確認
          </span>
          <span className={ds.legendItem}>
            <span className={`${ds.dot} ${ds.dotCancelled}`} /> キャンセル等
          </span>
        </div>
      </div>

      <div className={ds.weekScroll}>
        <div className={ds.weekGrid}>
          {weekDays.map((ymd, idx) => {
            const list = byDate.get(ymd) || [];
            const isToday = ymd === todayYmd;
            return (
              <div key={ymd} className={`${ds.dayCol} ${isToday ? ds.dayColToday : ""}`}>
                <div className={ds.dayHead}>
                  {weekdayJa[idx]} {ymd.slice(5).replace("-", "/")}
                </div>
                <div className={ds.dayBody}>
                  {list.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`${ds.eventBtn} ${eventClass(r.status)}`}
                      onClick={() => setDetail(r)}
                    >
                      <span className={ds.evTime}>{String(r.time || "").slice(0, 5)}</span>
                      <span className={ds.evStudent}>{r.studentNameKanji || "—"}</span>
                      <span className={ds.evMeta}>
                        {r.durationMinutes || "—"}分 · {r.instructorName || "講師未設定"}
                      </span>
                    </button>
                  ))}
                  {list.length === 0 ? <div className={ds.dayEmpty}>予定なし</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {detail ? (
        <div className={ds.modalRoot} role="dialog" aria-modal="true" aria-label="予約詳細">
          <button type="button" className={ds.modalBackdrop} aria-label="閉じる" onClick={() => setDetail(null)} />
          <div className={ds.modalCard}>
            <button type="button" className={ds.closeBtn} onClick={() => setDetail(null)} aria-label="閉じる">
              ×
            </button>
            <ReservationDetailPanel
              reservation={detail}
              teachers={teachers}
              slots={slots}
              rangeFrom={weekStart}
              rangeTo={weekEnd}
              onUpdated={async () => {
                await router.refresh();
                setDetail(null);
              }}
              onOpenCreateForStudent={() => {
                const d = String(detail?.date || "").slice(0, 10);
                const sid = String(detail?.studentId || "");
                if (!d || !sid) return;
                window.location.href = `/admin/reservations?ui=v2&date=${encodeURIComponent(d)}&openCreate=1&prefillStudentId=${encodeURIComponent(sid)}`;
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

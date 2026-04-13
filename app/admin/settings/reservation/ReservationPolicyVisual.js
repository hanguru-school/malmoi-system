"use client";

import styles from "../../../login/login.module.css";
import pv from "./reservation-policy-visual.module.css";

function Toggle({ on, onToggle, label }) {
  return (
    <div className={pv.toggleRow}>
      <span style={{ fontSize: "0.88rem", color: "#334155" }}>{label}</span>
      <button type="button" className={`${pv.toggle} ${on ? pv.toggleOn : ""}`} aria-pressed={on} onClick={onToggle}>
        <span className={pv.knob} />
      </button>
    </div>
  );
}

export default function ReservationPolicyVisual({ reservation, setReservation, saving, onSave }) {
  const r = reservation || {};

  const leadPresets = [0, 30, 60, 90, 120];
  const dayPresets = [7, 14, 30, 60, 90, 180, 365];
  const bufferPresets = [0, 5, 10, 15, 30];

  const maxDays = Number(r.maxBookableDays ?? 30);
  const minLead = Number(r.minBookingLeadMinutes ?? 0);
  const prep = Number(r.prepMinutes ?? 10);
  const bufferGuess = Math.max(0, prep - 10);

  return (
    <div>
      <div className={pv.grid}>
        <div className={pv.card}>
          <h4 className={pv.cardTitle}>受付モード</h4>
          <p className={pv.cardHint}>予約枠の扱いと生成方法です。</p>
          <label className={pv.cardHint} style={{ display: "block", fontWeight: 600 }}>
            予約方式
            <select
              className={pv.select}
              style={{ marginTop: 6 }}
              value={r.reservationMode || "time_unit"}
              onChange={(e) => setReservation({ reservationMode: e.target.value })}
            >
              <option value="time_unit">時間単位</option>
              <option value="course_unit">コース単位</option>
            </select>
          </label>
          <label className={pv.cardHint} style={{ display: "block", fontWeight: 600 }}>
            時間生成
            <select
              className={pv.select}
              style={{ marginTop: 6 }}
              value={r.timeGenerationMode || "direct_input"}
              onChange={(e) => setReservation({ timeGenerationMode: e.target.value })}
            >
              <option value="all_times">all_times</option>
              <option value="course_auto">course_auto</option>
              <option value="direct_input">direct_input</option>
            </select>
          </label>
        </div>

        <div className={pv.card}>
          <h4 className={pv.cardTitle}>当日予約・準備時間</h4>
          <p className={pv.cardHint}>学生の候補表示と開始直前の制限に効きます。</p>
          <Toggle
            on={r.allowSameDayBooking !== false}
            onToggle={() => setReservation({ allowSameDayBooking: !(r.allowSameDayBooking !== false) })}
            label="当日予約を許可"
          />
          <p className={pv.cardHint}>最低準備時間（分・開始前）</p>
          <div className={pv.chipRow}>
            {leadPresets.map((m) => (
              <button
                key={m}
                type="button"
                className={`${pv.chip} ${minLead === m ? pv.chipOn : ""}`}
                onClick={() => setReservation({ minBookingLeadMinutes: m })}
              >
                {m === 0 ? "なし" : `${m}分`}
              </button>
            ))}
          </div>
          <label className={pv.cardHint} style={{ display: "block", marginTop: 8 }}>
            カスタム（分）
            <input
              className={pv.input}
              type="number"
              min={0}
              value={minLead}
              onChange={(e) => setReservation({ minBookingLeadMinutes: Number(e.target.value || 0) })}
            />
          </label>
        </div>

        <div className={pv.card}>
          <h4 className={pv.cardTitle}>予約可能日数</h4>
          <p className={pv.cardHint}>学生が先の日程を選べる最大日数です。</p>
          <div className={pv.chipRow}>
            {dayPresets.map((d) => (
              <button
                key={d}
                type="button"
                className={`${pv.chip} ${maxDays === d ? pv.chipOn : ""}`}
                onClick={() => setReservation({ maxBookableDays: d })}
              >
                {d}日
              </button>
            ))}
          </div>
          <label className={pv.cardHint} style={{ display: "block", marginTop: 8 }}>
            カスタム（日）
            <input
              className={pv.input}
              type="number"
              min={1}
              value={maxDays}
              onChange={(e) => setReservation({ maxBookableDays: Number(e.target.value || 1) })}
            />
          </label>
        </div>

        <div className={pv.card}>
          <h4 className={pv.cardTitle}>レッスン前後・バッファ目安</h4>
          <p className={pv.cardHint}>枠生成・運用メモ用の準備分です。</p>
          <label className={pv.cardHint} style={{ display: "block", fontWeight: 600 }}>
            予約準備（分）
            <input
              className={pv.input}
              type="number"
              min={0}
              value={prep}
              onChange={(e) => setReservation({ prepMinutes: Number(e.target.value || 0) })}
            />
          </label>
          <p className={pv.cardHint}>バッファプリセット（分・目安）</p>
          <div className={pv.chipRow}>
            {bufferPresets.map((b) => (
              <button key={b} type="button" className={`${pv.chip} ${bufferGuess === b ? pv.chipOn : ""}`} onClick={() => setReservation({ prepMinutes: 10 + b })}>
                {b}分
              </button>
            ))}
          </div>
        </div>

        <div className={pv.card}>
          <h4 className={pv.cardTitle}>承認・表示</h4>
          <Toggle
            on={r.approvalMode === "auto"}
            onToggle={() => setReservation({ approvalMode: r.approvalMode === "auto" ? "admin" : "auto" })}
            label="自動確定（要確認）"
          />
          <Toggle
            on={Boolean(r.calendarDisplayShowCancelled)}
            onToggle={() => setReservation({ calendarDisplayShowCancelled: !r.calendarDisplayShowCancelled })}
            label="カレンダーにキャンセル表示"
          />
          <label className={pv.cardHint} style={{ display: "block", marginTop: 8, fontWeight: 600 }}>
            キャンセル期限（時間前）
            <input
              className={pv.input}
              type="number"
              min={0}
              value={r.cancelCutoffHours ?? 3}
              onChange={(e) => setReservation({ cancelCutoffHours: Number(e.target.value || 0) })}
            />
          </label>
          <label className={pv.cardHint} style={{ display: "block", fontWeight: 600 }}>
            変更申請の推奨締切（日前）
            <input
              className={pv.input}
              type="number"
              min={0}
              max={60}
              value={r.studentChangeDeadlineDays ?? 3}
              onChange={(e) => setReservation({ studentChangeDeadlineDays: Number(e.target.value || 0) })}
            />
          </label>
        </div>

        <div className={pv.card}>
          <h4 className={pv.cardTitle}>教室営業との連動</h4>
          <Toggle
            on={r.useClassroomHoursForSlotGeneration !== false}
            onToggle={() => setReservation({ useClassroomHoursForSlotGeneration: r.useClassroomHoursForSlotGeneration === false })}
            label="枠生成に教室詳細営業を反映"
          />
          <Toggle
            on={r.adminOverrideSameDay !== false}
            onToggle={() => setReservation({ adminOverrideSameDay: r.adminOverrideSameDay === false })}
            label="管理者は当日枠を優先評価"
          />
        </div>

        <div className={pv.card}>
          <h4 className={pv.cardTitle}>学生UI表示</h4>
          <Toggle
            on={Boolean(r.studentUiShowExpectedPoints)}
            onToggle={() => setReservation({ studentUiShowExpectedPoints: !r.studentUiShowExpectedPoints })}
            label="消費pt目安を表示"
          />
          <Toggle
            on={Boolean(r.studentUiShowBalanceAfterBooking)}
            onToggle={() => setReservation({ studentUiShowBalanceAfterBooking: !r.studentUiShowBalanceAfterBooking })}
            label="予約後残高を表示"
          />
        </div>

        <div className={pv.card}>
          <h4 className={pv.cardTitle}>レガシー営業（参考）</h4>
          <p className={pv.cardHint}>主に旧ロジック用。詳細は「教室運営」ビジュアル設定を優先してください。</p>
          <label className={pv.cardHint} style={{ display: "block", fontWeight: 600 }}>
            開始
            <input className={pv.input} value={r.operatingStartTime || ""} onChange={(e) => setReservation({ operatingStartTime: e.target.value })} />
          </label>
          <label className={pv.cardHint} style={{ display: "block", fontWeight: 600 }}>
            終了
            <input className={pv.input} value={r.operatingEndTime || ""} onChange={(e) => setReservation({ operatingEndTime: e.target.value })} />
          </label>
        </div>
      </div>

      <div className={pv.preview}>
        <div className={pv.previewTitle}>プレビュー（候補計算への影響）</div>
        <p className={pv.previewLine}>・予約可能日数: 約 {maxDays} 日先まで</p>
        <p className={pv.previewLine}>・当日予約: {r.allowSameDayBooking !== false ? "許可" : "不可"}</p>
        <p className={pv.previewLine}>・最低準備時間: {minLead} 分前までの枠は警告/不可になりやすい</p>
        <p className={pv.previewLine}>・教室営業: {r.useClassroomHoursForSlotGeneration !== false ? "詳細設定を枠生成に使用" : "固定レガシー時間を使用"}</p>
      </div>

      <div className={pv.actions}>
        <button className={styles.button} type="button" disabled={saving} onClick={onSave}>
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}

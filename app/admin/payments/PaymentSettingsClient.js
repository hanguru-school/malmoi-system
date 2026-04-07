"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";
import payStyles from "./admin.payments.module.css";
import AdminPointRulesPanel from "../AdminPointRulesPanel";

function newTierId() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function PaymentSettingsClient({ initial }) {
  const [globalTax, setGlobalTax] = useState(String(initial?.global?.taxRatePercent ?? 10));
  const [tiers, setTiers] = useState(() =>
    Array.isArray(initial?.global?.bonusTiers) ? initial.global.bonusTiers.map((t) => ({ ...t })) : [],
  );
  const [status, setStatus] = useState("");
  const [tplName, setTplName] = useState("新規ルール");
  const [tplBaseYen, setTplBaseYen] = useState("1");
  const [tplBasePts, setTplBasePts] = useState("1");
  const [tplTp, setTplTp] = useState("1");
  const [tplTm, setTplTm] = useState("1");

  const [studentQ, setStudentQ] = useState("");
  const [studentHits, setStudentHits] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkTemplateId, setBulkTemplateId] = useState(() => initial?.templates?.[0]?.id || "");
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 16));
  const [bulkMemo, setBulkMemo] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  const loadStudents = useCallback(async () => {
    const res = await fetch(`/api/admin/payments/students?q=${encodeURIComponent(studentQ)}`);
    const data = await res.json();
    if (data.ok) setStudentHits(data.students || []);
  }, [studentQ]);

  useEffect(() => {
    const t = setTimeout(loadStudents, 250);
    return () => clearTimeout(t);
  }, [loadStudents]);

  function toggleId(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(studentHits.map((s) => s.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function addTier() {
    setTiers((prev) => [
      ...prev,
      {
        id: newTierId(),
        minAmountInclusive: 10000,
        bonusPoints: 100,
        active: true,
        effectiveFrom: null,
        memo: "",
      },
    ]);
  }

  function updateTier(index, patch) {
    setTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function removeTier(index) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  async function runBulkAssign() {
    if (!bulkTemplateId) {
      setBulkStatus("テンプレートを選択してください。");
      return;
    }
    const ids = [...selectedIds];
    if (ids.length === 0) {
      setBulkStatus("学生を選択してください。");
      return;
    }
    setBulkStatus("処理中…");
    try {
      const res = await fetch("/api/admin/payments/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_assign",
          studentIds: ids,
          templateId: bulkTemplateId,
          effectiveFrom: new Date(bulkEffectiveFrom).toISOString(),
          memo: bulkMemo,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "失敗");
      const skipped = (data.results || []).filter((r) => r.skipped).length;
      const ok = (data.results || []).filter((r) => !r.skipped).length;
      setBulkStatus(`完了: ${ok}名適用、スキップ ${skipped}名（個別設定あり等）`);
      clearSelection();
    } catch (e) {
      setBulkStatus(e.message || "エラー");
    }
  }

  async function saveGlobal() {
    setStatus("保存中…");
    const res = await fetch("/api/admin/payments/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_global",
        patch: {
          taxRatePercent: Number(globalTax),
          bonusTiers: tiers.map((t) => ({
            id: String(t.id || newTierId()),
            minAmountInclusive: Math.max(0, Number(t.minAmountInclusive || 0)),
            bonusPoints: Math.max(0, Number(t.bonusPoints || 0)),
            active: t.active !== false,
            effectiveFrom: t.effectiveFrom || null,
            memo: String(t.memo || "").trim(),
          })),
        },
      }),
    });
    const data = await res.json();
    setStatus(data.ok ? "基本設定を保存しました" : data.error || "失敗");
  }

  async function saveTemplate() {
    setStatus("保存中…");
    const res = await fetch("/api/admin/payments/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_template",
        template: {
          name: tplName,
          baseYenAmount: Number(tplBaseYen),
          basePoints: Number(tplBasePts),
          bonusTiers: [],
          timePointAmount: Number(tplTp),
          timeMinutes: Number(tplTm),
        },
      }),
    });
    const data = await res.json();
    setStatus(data.ok ? `テンプレート保存: ${data.template?.id}` : data.error || "失敗");
  }

  const activePointRules = (initial?.pointConversionRules || []).filter((r) => r.isActive);
  const activeTimeRules = (initial?.pointTimeConversionRules || []).filter((r) => r.isActive);

  return (
    <div className={payStyles.stack}>
      <section className={payStyles.settingsCard}>
        <h2 className={payStyles.settingsCardTitle}>現在適用される換算（概要）</h2>
        <p className={payStyles.ruleHint}>下のパネルで編集・保存すると、以降の決済プレビューに反映されます。</p>
        <div className={payStyles.pointConversionBox}>
          <strong>円 → ポイント（active）</strong>
          <ul>
            {activePointRules.length === 0 ? <li>（登録なし）</li> : null}
            {activePointRules.map((r) => (
              <li key={r.id}>
                {r.yenAmount} 円 = {r.points} pt
              </li>
            ))}
          </ul>
          <strong style={{ display: "block", marginTop: "0.5rem" }}>ポイント → 時間（active）</strong>
          <ul>
            {activeTimeRules.length === 0 ? <li>（登録なし）</li> : null}
            {activeTimeRules.map((r) => (
              <li key={r.id}>
                {r.pointAmount} pt = {r.minutes} 分
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={payStyles.settingsCard}>
        <h2 className={payStyles.settingsCardTitle}>ポイント換算ルールの編集</h2>
        <p className={payStyles.ruleHint}>円⇔ポイント・ポイント⇔レッスン分の基本換算です。</p>
        <AdminPointRulesPanel />
      </section>

      <section className={payStyles.settingsCard}>
        <h2 className={payStyles.settingsCardTitle}>消費税・金額別ボーナス</h2>
        <p className={payStyles.ruleHint}>決済計算に使う全体ルールです。税込金額が下限以上ならボーナスポイントを加算します。</p>
        <div className={payStyles.taxField}>
          <label className={payStyles.taxLabel}>消費税率（%）</label>
          <input className={payStyles.taxInput} value={globalTax} onChange={(e) => setGlobalTax(e.target.value)} inputMode="decimal" />
        </div>

        <p className={payStyles.taxLabel}>金額別ボーナス（下限円・付与pt）</p>
        <div className={payStyles.tierList}>
          {tiers.map((t, index) => (
            <div key={t.id || index} className={payStyles.tierRow}>
              <div className={payStyles.tierField}>
                <span>税込がこの金額以上（円）</span>
                <input
                  className={payStyles.tierInput}
                  type="number"
                  min={0}
                  value={t.minAmountInclusive ?? ""}
                  onChange={(e) => updateTier(index, { minAmountInclusive: Number(e.target.value) })}
                />
              </div>
              <div className={payStyles.tierField}>
                <span>ボーナス（pt）</span>
                <input
                  className={payStyles.tierInput}
                  type="number"
                  min={0}
                  value={t.bonusPoints ?? ""}
                  onChange={(e) => updateTier(index, { bonusPoints: Number(e.target.value) })}
                />
              </div>
              <label className={payStyles.tierCheck}>
                <input
                  type="checkbox"
                  checked={t.active !== false}
                  onChange={(e) => updateTier(index, { active: e.target.checked })}
                />
                有効
              </label>
              <button type="button" className={payStyles.tierRemove} onClick={() => removeTier(index)}>
                削除
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={payStyles.addTierBtn} onClick={addTier}>
          + 金額帯を追加
        </button>
        <button type="button" className={`${styles.button} ${payStyles.saveBtn}`} onClick={saveGlobal}>
          基本設定を保存
        </button>
      </section>

      <section className={payStyles.settingsCard}>
        <h2 className={payStyles.settingsCardTitle}>換算テンプレート（一括・個別用）</h2>
        <p className={payStyles.ruleHint}>基本換算とは別に、テンプレート単位で「円あたりポイント」「時間換算」を定義します。</p>
        <div className={payStyles.templateForm}>
          <label className={styles.label}>名前</label>
          <input className={styles.input} value={tplName} onChange={(e) => setTplName(e.target.value)} />
          <div className={payStyles.templateRow2}>
            <div>
              <label className={styles.label}>基準金額（円）</label>
              <input className={styles.input} value={tplBaseYen} onChange={(e) => setTplBaseYen(e.target.value)} type="number" min={1} />
            </div>
            <div>
              <label className={styles.label}>基準ポイント（pt）</label>
              <input className={styles.input} value={tplBasePts} onChange={(e) => setTplBasePts(e.target.value)} type="number" min={1} />
            </div>
          </div>
          <div className={payStyles.templateRow2}>
            <div>
              <label className={styles.label}>時間換算: ポイント量</label>
              <input className={styles.input} value={tplTp} onChange={(e) => setTplTp(e.target.value)} type="number" min={1} />
            </div>
            <div>
              <label className={styles.label}>時間換算: 分</label>
              <input className={styles.input} value={tplTm} onChange={(e) => setTplTm(e.target.value)} type="number" min={1} />
            </div>
          </div>
          <button type="button" className={styles.button} onClick={saveTemplate}>
            テンプレートを保存
          </button>
        </div>
      </section>

      <section className={payStyles.settingsCard}>
        <h2 className={payStyles.settingsCardTitle}>一括ルール適用（複数学生）</h2>
        <p className={payStyles.ruleHint}>個別設定がある学生はスキップされます。今後の決済から反映されます。</p>
        <label className={styles.label}>学生検索</label>
        <input
          className={styles.input}
          placeholder="名前・フリガナ・学生番号・電話"
          value={studentQ}
          onChange={(e) => setStudentQ(e.target.value)}
        />
        <p className={payStyles.ruleHint}>選択 {selectedIds.size} 名</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <button type="button" className={styles.registerSecondaryButton} onClick={selectAllVisible}>
            表示中を全選択
          </button>
          <button type="button" className={styles.registerSecondaryButton} onClick={clearSelection}>
            選択解除
          </button>
        </div>
        <div
          style={{
            maxHeight: 240,
            overflow: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          {studentHits.map((s) => (
            <label
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleId(s.id)} />
              <span>
                <strong>{s.nameKanji}</strong> {s.studentNumber} — {s.currentRuleLabel || "—"}
              </span>
            </label>
          ))}
        </div>
        <label className={styles.label}>適用テンプレート</label>
        <select className={styles.input} value={bulkTemplateId} onChange={(e) => setBulkTemplateId(e.target.value)}>
          <option value="">選択</option>
          {(initial?.templates || []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className={styles.label}>適用開始</label>
        <input
          className={styles.input}
          type="datetime-local"
          value={bulkEffectiveFrom}
          onChange={(e) => setBulkEffectiveFrom(e.target.value)}
        />
        <label className={styles.label}>メモ</label>
        <input className={styles.input} value={bulkMemo} onChange={(e) => setBulkMemo(e.target.value)} />
        <button type="button" className={styles.button} onClick={runBulkAssign}>
          一括で適用
        </button>
        {bulkStatus ? <p>{bulkStatus}</p> : null}
      </section>

      <section className={payStyles.settingsCard}>
        <h2 className={payStyles.settingsCardTitle}>登録済みテンプレート</h2>
        <ul className={payStyles.list}>
          {(initial?.templates || []).map((t) => (
            <li key={t.id}>
              <strong>{t.name}</strong> <code>{t.id}</code> — ￥{t.baseYenAmount}/{t.basePoints}pt, 時間 {t.timePointAmount}pt→
              {t.timeMinutes}分
            </li>
          ))}
        </ul>
      </section>

      <section className={payStyles.settingsCard}>
        <h2 className={payStyles.settingsCardTitle}>設定履歴（直近）</h2>
        <ul className={payStyles.list}>
          {(initial?.history || []).slice(0, 15).map((h) => (
            <li key={h.id}>
              {h.at} [{h.changeKind}] {h.targetLabel}
            </li>
          ))}
        </ul>
      </section>

      {status ? <p role="status">{status}</p> : null}
    </div>
  );
}

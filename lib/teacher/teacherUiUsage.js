/**
 * 先生UIの利用頻度（localStorage・サーバーJSONは変更しない）
 * 将来の個人化・ボタン並び替え用の集計のみ
 */

const STORAGE_KEY = "malmoi:teacherUiUsage:v1";

function readState() {
  if (typeof window === "undefined") return { presets: {}, templates: {}, recent: {}, v: 1 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const p = JSON.parse(raw || "{}");
    if (!p || typeof p !== "object") return { presets: {}, templates: {}, recent: {}, v: 1 };
    return {
      presets: typeof p.presets === "object" && p.presets ? p.presets : {},
      templates: typeof p.templates === "object" && p.templates ? p.templates : {},
      recent: typeof p.recent === "object" && p.recent ? p.recent : {},
      v: 1,
    };
  } catch {
    return { presets: {}, templates: {}, recent: {}, v: 1 };
  }
}

function writeState(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota
  }
}

function bump(map, id) {
  const k = String(id || "").trim();
  if (!k) return map;
  return { ...map, [k]: Number(map[k] || 0) + 1 };
}

/** クイック定型ボタン */
export function recordTeacherPresetUse(presetId) {
  const id = String(presetId || "").trim();
  if (!id) return;
  const s = readState();
  writeState({ ...s, presets: bump(s.presets, id) });
}

/** 宿題テンプレート適用 */
export function recordTeacherTemplateUse(templateId) {
  const id = String(templateId || "").trim();
  if (!id) return;
  const s = readState();
  writeState({ ...s, templates: bump(s.templates, id) });
}

/** 直近登録の再利用 */
export function recordTeacherRecentHwUse() {
  const s = readState();
  writeState({ ...s, recent: bump(s.recent, "reuse") });
}

/**
 * presetId 配列を利用回数の多い順に並べ替え（同率は元順）
 * @param {Array<{ id: string }>} defaultOrder
 * @returns {string[]}
 */
export function sortPresetIdsByUsage(defaultOrder = []) {
  const s = readState();
  const base = defaultOrder.map((x) => String(x.id || "").trim()).filter(Boolean);
  const scores = s.presets || {};
  return [...base].sort((a, b) => (Number(scores[b] || 0) - Number(scores[a] || 0)));
}

export function getTeacherUiUsageSnapshot() {
  return readState();
}

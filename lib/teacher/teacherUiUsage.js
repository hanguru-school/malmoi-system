/**
 * 先生UIの利用ログ（localStorage・サーバーJSONは変更しない）
 * 頻度・最終利用時刻・最近の使用順 — 将来の並び替え/推奨用
 */

const STORAGE_KEY = "malmoi:teacherUiUsage:v1";
const SCHEMA_V = 2;
const MAX_RECENT_IDS = 24;

function readState() {
  if (typeof window === "undefined") {
    return {
      v: SCHEMA_V,
      presets: {},
      templates: {},
      presetRecent: [],
      templateRecent: [],
      recent: {},
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const p = JSON.parse(raw || "{}");
    if (!p || typeof p !== "object") return migrateLegacy(null);
    if (Number(p.v) >= SCHEMA_V) {
      return {
        v: SCHEMA_V,
        presets: typeof p.presets === "object" && p.presets ? p.presets : {},
        templates: typeof p.templates === "object" && p.templates ? p.templates : {},
        presetRecent: Array.isArray(p.presetRecent) ? p.presetRecent.map(String) : [],
        templateRecent: Array.isArray(p.templateRecent) ? p.templateRecent.map(String) : [],
        recent: typeof p.recent === "object" && p.recent ? p.recent : {},
      };
    }
    return migrateLegacy(p);
  } catch {
    return migrateLegacy(null);
  }
}

function migrateLegacy(p) {
  const presets = {};
  const templates = {};
  if (p?.presets && typeof p.presets === "object") {
    Object.entries(p.presets).forEach(([k, v]) => {
      if (typeof v === "number") presets[k] = { count: v, lastUsedAt: null };
      else if (v && typeof v === "object") presets[k] = { count: Number(v.count || 0), lastUsedAt: v.lastUsedAt || null };
    });
  }
  if (p?.templates && typeof p.templates === "object") {
    Object.entries(p.templates).forEach(([k, v]) => {
      if (typeof v === "number") templates[k] = { count: v, lastUsedAt: null };
      else if (v && typeof v === "object") templates[k] = { count: Number(v.count || 0), lastUsedAt: v.lastUsedAt || null };
    });
  }
  return {
    v: SCHEMA_V,
    presets,
    templates,
    presetRecent: [],
    templateRecent: [],
    recent: typeof p?.recent === "object" && p.recent ? p.recent : {},
  };
}

function writeState(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, v: SCHEMA_V }));
  } catch {
    // ignore quota
  }
}

function bumpEntry(map, id) {
  const k = String(id || "").trim();
  if (!k) return map;
  const cur = map[k] && typeof map[k] === "object" ? map[k] : { count: 0, lastUsedAt: null };
  const prevCount = typeof cur.count === "number" ? cur.count : Number(cur) || 0;
  return {
    ...map,
    [k]: { count: prevCount + 1, lastUsedAt: new Date().toISOString() },
  };
}

function pushRecent(list, id) {
  const k = String(id || "").trim();
  if (!k) return list;
  return [k, ...list.filter((x) => x !== k)].slice(0, MAX_RECENT_IDS);
}

/** クイック定型 */
export function recordTeacherPresetUse(presetId) {
  const id = String(presetId || "").trim();
  if (!id) return;
  const s = readState();
  writeState({
    ...s,
    presets: bumpEntry(s.presets, id),
    presetRecent: pushRecent(s.presetRecent || [], id),
  });
}

/** 宿題テンプレート適用 */
export function recordTeacherTemplateUse(templateId) {
  const id = String(templateId || "").trim();
  if (!id) return;
  const s = readState();
  writeState({
    ...s,
    templates: bumpEntry(s.templates, id),
    templateRecent: pushRecent(s.templateRecent || [], id),
  });
}

/** 直近登録の再利用 */
export function recordTeacherRecentHwUse() {
  const s = readState();
  const ts = new Date().toISOString();
  const raw = s.recent?.reuse;
  const prevCount = typeof raw === "number" ? raw : Number(raw?.count || 0);
  writeState({
    ...s,
    recent: {
      ...s.recent,
      reuse: { count: prevCount + 1, lastUsedAt: ts },
    },
  });
}

function entryScore(e) {
  if (typeof e === "number") return { count: e, lastUsedAt: null };
  if (!e || typeof e !== "object") return { count: 0, lastUsedAt: null };
  return { count: Number(e.count || 0), lastUsedAt: e.lastUsedAt || null };
}

/**
 * preset 表示順: 最終利用が新しい → 回数多い → 既定順
 * @param {Array<{ id: string }>} defaultOrder
 */
export function sortPresetIdsByUsage(defaultOrder = []) {
  const s = readState();
  const base = defaultOrder.map((x) => String(x.id || "").trim()).filter(Boolean);
  const presets = s.presets || {};
  const recent = s.presetRecent || [];
  const rank = new Map(recent.map((id, i) => [id, i]));
  return [...base].sort((a, b) => {
    const ea = entryScore(presets[a]);
    const eb = entryScore(presets[b]);
    const ta = ea.lastUsedAt ? Date.parse(ea.lastUsedAt) : 0;
    const tb = eb.lastUsedAt ? Date.parse(eb.lastUsedAt) : 0;
    if (tb !== ta) return tb - ta;
    if (eb.count !== ea.count) return eb.count - ea.count;
    const ra = rank.has(a) ? rank.get(a) : 999;
    const rb = rank.has(b) ? rank.get(b) : 999;
    if (ra !== rb) return ra - rb;
    return base.indexOf(a) - base.indexOf(b);
  });
}

export function getTeacherUiUsageSnapshot() {
  return readState();
}

/** デバッグ・次段階用: 最近使ったプリセットID（新しい順） */
export function getRecentPresetIds() {
  const s = readState();
  return Array.isArray(s.presetRecent) ? [...s.presetRecent] : [];
}

/**
 * 「本日の未処理」からの連続処理用キュー（sessionStorage・JSON スキーマは変更しない）
 */

const STORAGE_KEY = "malmoi:opsFlowQueue:v1";

function readState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || p.v !== 1 || !Array.isArray(p.urls)) return null;
    return { urls: p.urls.map(String), role: String(p.role || "teacher") };
  } catch {
    return null;
  }
}

function writeState(urls, role) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, urls, role }));
  } catch {
    // ignore
  }
}

/**
 * URL が現在ページと同一タスクか（pathname + 主要クエリ）
 */
export function opsFlowUrlMatches(storedUrl, pathname, search) {
  try {
    const a = new URL(storedUrl, "http://localhost");
    if (a.pathname !== pathname) return false;
    const b = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const keys = ["lessonUnitId", "studentId", "refDate", "lessonDate", "date"];
    for (const k of keys) {
      if (a.searchParams.has(k) && b.has(k) && a.searchParams.get(k) !== b.get(k)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setOpsFlowQueue(urls, role = "teacher") {
  const list = (urls || []).map(String).filter(Boolean);
  writeState(list, role);
}

export function clearOpsFlowQueue() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function opsFlowDoneFallback(role) {
  return role === "admin" ? "/admin/ops-today" : "/teacher/ops-today";
}

/**
 * 現在ページに対応するキュー項目を1件消化し、次URLまたは完了を返す。
 * @returns {{ next: string | null, done: boolean, matched: boolean }}
 */
export function completeOpsFlowStep(pathname, search) {
  const state = readState();
  if (!state?.urls?.length) return { next: null, done: false, matched: false, role: "teacher" };
  const role = state.role || "teacher";
  const fullSearch = search && !search.startsWith("?") ? `?${search}` : search || "";
  const idx = state.urls.findIndex((u) => opsFlowUrlMatches(u, pathname, fullSearch));
  if (idx === -1) return { next: null, done: false, matched: false, role };
  const newUrls = state.urls.filter((_, i) => i !== idx);
  writeState(newUrls, role);
  if (newUrls.length === 0) return { next: null, done: true, matched: true, role };
  return { next: newUrls[0], done: false, matched: true, role };
}

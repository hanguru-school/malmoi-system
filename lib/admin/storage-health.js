import fs from "fs/promises";
import path from "path";
import { readStore, getAuthStoreAbsolutePath } from "../auth/store";

function sortByIsoDesc(items, key) {
  return [...(items || [])].sort((a, b) => {
    const ta = new Date(a[key] || 0).getTime();
    const tb = new Date(b[key] || 0).getTime();
    return tb - ta;
  });
}

function safeRelativeToCwd(absolutePath) {
  try {
    const rel = path.relative(process.cwd(), absolutePath);
    if (!rel || rel.startsWith("..")) return null;
    return rel;
  } catch {
    return null;
  }
}

function summarizeReservation(r) {
  if (!r) return null;
  return {
    id: r.id,
    status: r.status,
    date: r.date,
    time: r.time,
    durationMinutes: r.durationMinutes,
    slotId: r.slotId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    cancelledAt: r.cancelledAt,
  };
}

function summarizeAudit(entry) {
  if (!entry) return null;
  return {
    id: entry.id,
    at: entry.at,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    actorRole: entry.actorRole,
    summary: entry.summary,
  };
}

function summarizeSlot(s) {
  if (!s) return null;
  return {
    id: s.id,
    date: s.date,
    time: s.time,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

/**
 * 運用向け永続化ヘルス（Prisma 不使用。JSON ストア基準）
 * DATABASE_URL 値は含めない。
 */
export async function buildStorageHealthReport() {
  const absolutePath = getAuthStoreAbsolutePath();
  let fileStat = null;
  let fileStatError = null;
  try {
    fileStat = await fs.stat(absolutePath);
  } catch (e) {
    fileStatError = e?.code || e?.message || "stat_failed";
  }

  let storeReadError = null;
  let store = null;
  try {
    store = await readStore();
  } catch (e) {
    storeReadError = e?.message || "readStore_failed";
  }

  const counts = store
    ? {
        storeVersion: store.version,
        users: (store.users || []).length,
        students: (store.students || []).length,
        sessions: (store.sessions || []).length,
        reservations: (store.reservations || []).length,
        reservationSlots: (store.reservationSlots || []).length,
        auditLogs: (store.auditLogs || []).length,
        mailLogs: (store.mailLogs || []).length,
        lessonNotes: (store.lessonNotes || []).length,
        notices: (store.notices || []).length,
        paymentTransactions: (store.paymentTransactions || []).length,
        paymentEvents: (store.paymentEvents || []).length,
      }
    : null;

  const recentReservations = store
    ? sortByIsoDesc(store.reservations || [], "updatedAt").slice(0, 5).map(summarizeReservation)
    : [];
  const recentAudit = store
    ? sortByIsoDesc(store.auditLogs || [], "at").slice(0, 5).map(summarizeAudit)
    : [];
  const recentSlots = store
    ? sortByIsoDesc(store.reservationSlots || [], "updatedAt").slice(0, 5).map(summarizeSlot)
    : [];

  return {
    ok: Boolean(store) && !storeReadError,
    generatedAt: new Date().toISOString(),
    persistence: {
      kind: "json_file",
      prismaUsed: false,
      databaseUrlEnvSet: Boolean(process.env.DATABASE_URL?.trim()),
      authStoreEnvOverride: Boolean(process.env.AUTH_STORE_PATH?.trim()),
      fileName: path.basename(absolutePath),
      pathRelativeToCwd: safeRelativeToCwd(absolutePath),
      fileExists: Boolean(fileStat?.isFile()),
      fileSizeBytes: fileStat?.isFile() ? fileStat.size : null,
      fileMtimeIso: fileStat?.mtime ? new Date(fileStat.mtime).toISOString() : null,
      fileStatError,
    },
    storeReadError,
    counts,
    samples: {
      reservations: recentReservations,
      reservationSlots: recentSlots,
      auditLogs: recentAudit,
    },
    nodeVersion: process.version,
  };
}

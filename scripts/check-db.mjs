#!/usr/bin/env node
/**
 * MalMoi 永続化ストア確認（JSON ファイル）。
 * 本リポジトリに Prisma / DATABASE_URL はありません。
 *
 * 使い方（プロジェクトルートで）:
 *   npm run check:db
 *   AUTH_STORE_PATH=/path/to/auth-store.json npm run check:db
 *
 * 本番推奨パス（systemd の AUTH_STORE_PATH と一致させる）:
 *   AUTH_STORE_PATH=/srv/malmoi/shared/auth-store.json npm run check:db
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
process.chdir(root);

function resolveStorePath() {
  const env = String(process.env.AUTH_STORE_PATH || "").trim();
  if (env) {
    return path.isAbsolute(env) ? env : path.resolve(root, env);
  }
  return path.join(root, ".data", "auth-store.json");
}

function sortByIsoDesc(items, key) {
  return [...(items || [])].sort((a, b) => {
    const ta = new Date(a[key] || 0).getTime();
    const tb = new Date(b[key] || 0).getTime();
    return tb - ta;
  });
}

async function main() {
  const absolutePath = resolveStorePath();
  const relative = path.relative(root, absolutePath);

  console.log("=== MalMoi storage check (JSON file, not Prisma) ===");
  console.log("Node:", process.version);
  console.log("CWD:", process.cwd());
  console.log("DATABASE_URL set:", Boolean(String(process.env.DATABASE_URL || "").trim()));
  console.log("AUTH_STORE_PATH set:", Boolean(String(process.env.AUTH_STORE_PATH || "").trim()));
  console.log("Store file (basename):", path.basename(absolutePath));
  console.log("Store file (relative to project):", relative.startsWith("..") ? "(outside project)" : relative || ".");

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch (e) {
    console.error("ERROR: cannot stat store file:", e?.code || e?.message);
    process.exit(1);
  }

  if (!stat.isFile()) {
    console.error("ERROR: path is not a file");
    process.exit(1);
  }

  const raw = await fs.readFile(absolutePath, "utf8");
  let data;
  try {
    data = raw.trim() ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("ERROR: invalid JSON:", e?.message);
    process.exit(1);
  }

  const counts = {
    version: data.version,
    users: (data.users || []).length,
    students: (data.students || []).length,
    sessions: (data.sessions || []).length,
    reservations: (data.reservations || []).length,
    reservationSlots: (data.reservationSlots || []).length,
    auditLogs: (data.auditLogs || []).length,
    mailLogs: (data.mailLogs || []).length,
    lessonNotes: (data.lessonNotes || []).length,
    notices: (data.notices || []).length,
    paymentTransactions: (data.paymentTransactions || []).length,
    paymentEvents: (data.paymentEvents || []).length,
  };

  const recentRes = sortByIsoDesc(data.reservations || [], "updatedAt").slice(0, 5);
  const recentAudit = sortByIsoDesc(data.auditLogs || [], "at").slice(0, 5);

  console.log("File size bytes:", stat.size);
  console.log("Mtime:", stat.mtime.toISOString());
  console.log("Counts:", JSON.stringify(counts, null, 2));
  console.log("Recent reservations (summary):");
  console.log(
    JSON.stringify(
      recentRes.map((r) => ({
        id: r.id,
        status: r.status,
        date: r.date,
        time: r.time,
        updatedAt: r.updatedAt,
      })),
      null,
      2
    )
  );
  console.log("Recent audit logs (summary):");
  console.log(
    JSON.stringify(
      recentAudit.map((a) => ({
        id: a.id,
        at: a.at,
        action: a.action,
        targetType: a.targetType,
        summary: a.summary,
      })),
      null,
      2
    )
  );
  console.log("OK");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * auth-store.json 기반 관리자 비밀번호 강제 재설정 (비상용)
 *
 * 사용 전: 앱을 중지하거나, 동시 쓰기가 없을 때 실행하는 것이 안전합니다.
 * 실행 후: 반드시 로그인하여 비밀번호를 다시 변경하세요.
 *
 * 예 (표준 입력으로 새 비밀번호 1줄):
 *   MALMOI_RESET_CONFIRM=yes printf '%s\n' '새비밀번호4자이상' | \\
 *     node scripts/reset-admin-password.mjs \\
 *     --store /srv/malmoi/shared/auth-store.json \\
 *     --email office@hanguru.school \\
 *     --stdin
 *
 * 예 (환경변수, 셸 히스토리 주의):
 *   MALMOI_RESET_CONFIRM=yes RESET_ADMIN_NEW_PASSWORD='...' \\
 *     node scripts/reset-admin-password.mjs --store ... --email office@hanguru.school
 */

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

function hashPassword(rawPassword) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(rawPassword || ""), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parseArgs(argv) {
  const out = { store: "", email: "", stdin: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--store" && argv[i + 1]) {
      out.store = argv[++i];
    } else if (a === "--email" && argv[i + 1]) {
      out.email = argv[++i];
    } else if (a === "--stdin") {
      out.stdin = true;
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    }
  }
  return out;
}

async function readPasswordFromStdin() {
  const chunks = [];
  for await (const chunk of input) chunks.push(chunk);
  const s = Buffer.concat(chunks).toString("utf8").trim();
  return s;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node scripts/reset-admin-password.mjs --store <auth-store.json> --email <email> [--stdin]

Requires env MALMOI_RESET_CONFIRM=yes

Password source (first match):
  1) --stdin  : read one line from stdin
  2) RESET_ADMIN_NEW_PASSWORD env
  3) interactive prompt (twice)
`);
    process.exit(0);
  }

  if (process.env.MALMOI_RESET_CONFIRM !== "yes") {
    console.error("ERROR: Set MALMOI_RESET_CONFIRM=yes to run this destructive script.");
    process.exit(1);
  }

  const storePath = args.store || process.env.AUTH_STORE_PATH || "";
  if (!storePath) {
    console.error("ERROR: --store <path> or AUTH_STORE_PATH required.");
    process.exit(1);
  }

  const targetEmail = normalizeEmail(args.email || process.env.RESET_ADMIN_EMAIL || "office@hanguru.school");
  if (!targetEmail) {
    console.error("ERROR: --email or RESET_ADMIN_EMAIL required.");
    process.exit(1);
  }

  let newPassword = "";
  if (args.stdin) {
    newPassword = await readPasswordFromStdin();
  } else if (process.env.RESET_ADMIN_NEW_PASSWORD) {
    newPassword = String(process.env.RESET_ADMIN_NEW_PASSWORD);
  } else {
    const rl = readline.createInterface({ input, output });
    try {
      const a = await rl.question("New password (min 4 chars): ");
      const b = await rl.question("Confirm password: ");
      if (a !== b) {
        console.error("ERROR: passwords do not match.");
        process.exit(1);
      }
      newPassword = a;
    } finally {
      rl.close();
    }
  }

  if (String(newPassword).length < 4) {
    console.error("ERROR: password must be at least 4 characters (same as app rules).");
    process.exit(1);
  }

  const abs = path.resolve(storePath);
  const raw = await fs.readFile(abs, "utf8");
  const store = JSON.parse(raw);
  if (!Array.isArray(store.users)) {
    console.error("ERROR: invalid auth store: users[] missing.");
    process.exit(1);
  }

  const idx = store.users.findIndex((u) => normalizeEmail(u?.email) === targetEmail);
  if (idx < 0) {
    console.error(`ERROR: no user with email ${targetEmail}`);
    process.exit(1);
  }

  const user = store.users[idx];
  if (user.role !== "admin") {
    console.error(`ERROR: user ${targetEmail} has role=${user.role}, expected admin.`);
    process.exit(1);
  }

  const backupPath = `${abs}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await fs.writeFile(backupPath, raw, "utf8");
  console.log(`OK: backup written: ${backupPath}`);

  user.passwordHash = hashPassword(newPassword);
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.mustChangePassword = true;
  user.updatedAt = new Date().toISOString();

  await fs.writeFile(abs, JSON.stringify(store, null, 2), "utf8");
  console.log(`OK: password reset for admin ${targetEmail}`);
  console.log("Next: start app, log in, change password from /password/change-required or profile.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

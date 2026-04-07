#!/usr/bin/env node
/**
 * CI: 문서·env 예시 존재 확인 + 빌드 후 경량 HTTP 스모크 (Linux/macOS bash)
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function mustExist(rel) {
  const p = path.join(root, rel);
  if (!existsSync(p)) {
    console.error(`[ci-verify] missing: ${rel}`);
    process.exit(1);
  }
  console.log(`[ci-verify] ok: ${rel}`);
}

const requiredFiles = [
  ".env.example",
  ".env.production.example",
  ".env.development.example",
  "deploy/deploy-prod.sh",
];

const requiredDocs = [
  "docs/branch-strategy-portal-ko.md",
  "docs/operations-auto-deploy-ko.md",
  "docs/settings-ia-ko.md",
  "docs/payment-structure-ko.md",
  "docs/invite-registration-ko.md",
  "docs/time-reservation-model-ko.md",
  "docs/calendar-model-ko.md",
  "docs/notifications-rules-ko.md",
];

for (const f of requiredFiles) mustExist(f);
for (const f of requiredDocs) mustExist(f);

if (process.env.CI_SKIP_HTTP_SMOKE === "1") {
  console.log("[ci-verify] CI_SKIP_HTTP_SMOKE=1 — HTTP 스모크 생략");
  process.exit(0);
}

const port = 3999;
const cmd = `
set -euo pipefail
cd "${root.replace(/"/g, '\\"')}"
npx next start -p ${port} -H 127.0.0.1 > /tmp/malmoi-ci-next.log 2>&1 &
PID=$!
cleanup() { kill $PID 2>/dev/null || true; }
trap cleanup EXIT
for i in $(seq 1 90); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${port}/login" 2>/dev/null; then break; fi
  sleep 1
  if ! kill -0 $PID 2>/dev/null; then
    echo "[ci-verify] next process exited early"
    cat /tmp/malmoi-ci-next.log || true
    exit 1
  fi
  if [ "$i" -eq 90 ]; then
    echo "[ci-verify] timeout waiting for /login"
    cat /tmp/malmoi-ci-next.log || true
    exit 1
  fi
done
curl -fsS -o /dev/null "http://127.0.0.1:${port}/login"
curl -fsS -o /dev/null "http://127.0.0.1:${port}/admin"
curl -fsS -o /dev/null "http://127.0.0.1:${port}/teacher"
curl -fsS -o /dev/null "http://127.0.0.1:${port}/register/invite"
echo "[ci-verify] HTTP smoke OK"
`;

execSync(cmd, { shell: "/bin/bash", stdio: "inherit" });
console.log("[ci-verify] all checks passed");

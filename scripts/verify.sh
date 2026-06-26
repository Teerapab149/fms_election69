#!/usr/bin/env bash
# Pre-merge gate (5-year-readiness Pillar 1.3): build GREEN + vote-net e2e + smoke.
# These three together are the "nothing silently broke voting" checklist.
#
# Run with the dev server STOPPED — it builds, and .next is exclusive on Windows:
#   bash scripts/verify.sh
#
# Fast mode — reuse an already-running server, skip the build/start (handy while
# the owner's dev server is live on :3000):
#   VERIFY_REUSE_URL=http://localhost:3000 bash scripts/verify.sh
set -euo pipefail

BASE_PATH="/fms-ovs"
PORT="${VERIFY_PORT:-3100}"

if [ -n "${VERIFY_REUSE_URL:-}" ]; then
  URL="$VERIFY_REUSE_URL"
  echo "[verify] reusing server at $URL (skipping build/start)"
else
  URL="http://localhost:${PORT}"
  echo "[verify] build…"
  npm run build
  echo "[verify] starting next on :${PORT}…"
  npx next start -p "${PORT}" >/tmp/verify-next.log 2>&1 &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
fi

echo "[verify] waiting for ${URL}${BASE_PATH}/api/health…"
for i in $(seq 1 60); do
  if curl -sf "${URL}${BASE_PATH}/api/health" >/dev/null 2>&1; then echo "[verify] server ready"; break; fi
  if [ "$i" = "60" ]; then echo "[verify] server never became ready" >&2; exit 1; fi
  sleep 2
done

# e2e BEFORE smoke on purpose: e2e's single admin login (ballot-secrecy test)
# must precede smoke's login-burst test, or the rate limiter (10/5min/IP) trips it.
echo "[verify] e2e vote-net…"
PW_BASE_URL="$URL" npm run e2e:gate

echo "[verify] smoke…"
BASE="${URL}${BASE_PATH}" npm run smoke

echo "[verify] ✅ ALL GATES PASSED (build + e2e + smoke)"

#!/usr/bin/env bash
set -euo pipefail

MAX_RETRIES=${MAX_RETRIES:-3}
SLEEP_SECONDS=${SLEEP_SECONDS:-5}

echo "Running E2E tests with up to ${MAX_RETRIES} attempts"

ARTIFACT_DIR=${ARTIFACT_DIR:-artifacts}
mkdir -p "$ARTIFACT_DIR"

i=1
while [ $i -le $MAX_RETRIES ]; do
  echo "Attempt #$i"
  # capture logs per attempt
  LOG_FILE="$ARTIFACT_DIR/e2e_attempt_${i}.log"
  if npm run test:e2e > "$LOG_FILE" 2>&1; then
    echo "E2E tests passed on attempt #$i"
    # save the successful log as latest
    cp "$LOG_FILE" "$ARTIFACT_DIR/e2e_latest.log" || true
    exit 0
  fi
  echo "E2E attempt #$i failed (log: $LOG_FILE)"
  if [ $i -lt $MAX_RETRIES ]; then
    echo "Sleeping for ${SLEEP_SECONDS}s before retry"
    sleep ${SLEEP_SECONDS}
  fi
  i=$((i+1))
done

# Final diagnostics collection
SYS_INFO_FILE="$ARTIFACT_DIR/system_info.txt"
{
  echo "=== Node / npm versions ==="
  node -v 2>/dev/null || true
  npm -v 2>/dev/null || true
  echo "\n=== clamscan info ==="
  which clamscan 2>/dev/null || true
  clamscan --version 2>/dev/null || true
  echo "\n=== puppeteer info ==="
  node -e "try{console.log(require('puppeteer/package.json').version)}catch(e){console.log('puppeteer: missing')}" 2>/dev/null || true
  echo "\n=== local chromium listing ==="
  ls -la node_modules/puppeteer/.local-chromium 2>/dev/null || true
  echo "\n=== relevant env vars ==="
  env | grep -E 'CLAMAV|CI_PUPPETEER|MAX_RETRIES|SLEEP' || true
  echo "\n=== last 200 lines of syslog (if available) ==="
  journalctl -n 200 --no-pager 2>/dev/null || true
  echo "\n=== freshclam log (if available) ==="
  if [ -f /var/log/clamav/freshclam.log ]; then
    tail -n 200 /var/log/clamav/freshclam.log || true
  fi
} > "$SYS_INFO_FILE" || true

# indicate failure
echo "E2E tests failed after ${MAX_RETRIES} attempts; artifacts collected in $ARTIFACT_DIR"
exit 1

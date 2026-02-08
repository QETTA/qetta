#!/usr/bin/env bash
set -euo pipefail

MAX_RETRIES=${MAX_RETRIES:-3}
SLEEP_SECONDS=${SLEEP_SECONDS:-5}

echo "Running E2E tests with up to ${MAX_RETRIES} attempts"

i=1
while [ $i -le $MAX_RETRIES ]; do
  echo "Attempt #$i"
  if npm run test:e2e; then
    echo "E2E tests passed on attempt #$i"
    exit 0
  fi
  echo "E2E attempt #$i failed"
  if [ $i -lt $MAX_RETRIES ]; then
    echo "Sleeping for ${SLEEP_SECONDS}s before retry"
    sleep ${SLEEP_SECONDS}
  fi
  i=$((i+1))
done

echo "E2E tests failed after ${MAX_RETRIES} attempts"
exit 1

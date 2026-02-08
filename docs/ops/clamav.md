# ClamAV Integration (Qetta)

This document explains how ClamAV integrates with Qetta for file upload virus scanning.

## Overview
- ClamAV is optional and controlled by environment variable `CLAMAV_SCAN_ENABLED`.
- The runtime binary `clamscan` is used by default. Alternatively, `clamd` can be used by running a `clamav` service and calling `clamdscan`.
- By default scanning is disabled (safe for CI/test). Enable in production.

## Environment variables
- `CLAMAV_SCAN_ENABLED` (default: false) — set to `true` to enable scanning in runtime.
- `CLAMAV_COMMAND` (default: `clamscan`) — command to run for scanning (e.g., `clamscan` or `clamdscan`).

## Docker (local / dev)
- The `Dockerfile` now installs ClamAV (`clamscan` binary) so enabling `CLAMAV_SCAN_ENABLED=true` in `.env` will run scans inside the container.
- Optionally, run `docker-compose up` which also starts a `clamav` service (`mkodockx/docker-clamav:alpine`) that provides `clamd` if you prefer `clamdscan`.

## CI
- Tests mock ClamAV for unit tests. If you want a real integration test in CI, update the job to install ClamAV and set `CLAMAV_SCAN_ENABLED=true`.

## Operational notes
- Keep the ClamAV virus database updated (`freshclam`), either at container start or via periodic job.
- Consider running scans in an isolated sidecar or offload to a managed scanning service for scalability.
- Quarantine policy: infected files are rejected at upload and an audit log is written (`evidence.quarantined` / `template.quarantined`). Implement separate operator workflow to retrieve/quarantine files for manual review.

## Troubleshooting
- If `clamscan` is not found at runtime, ensure the Docker image contains ClamAV or that `CLAMAV_COMMAND` points to a reachable scanner.
- For high throughput, prefer `clamd` and `clamdscan` to avoid per-request DB load.

# Quarantine Operator Guide

This guide explains how operators should handle quarantined files in Qetta.

1. Access the admin UI at `/admin/quarantine` (requires partner organization auth).
2. The page lists quarantined files with reason and creation time.
3. Click **download** to fetch the quarantined file for manual inspection.
4. If file is verified clean, use backend tooling to move file into evidence storage and update DB status to `uploaded` or `pii_masked` as appropriate.
5. If infected, follow company incident response (isolate, delete, notify customer if necessary).
6. For automation, consider implementing a 'restore' and 'destroy' endpoints with audit logs and RBAC.

Operational notes
- Quarantined files are stored under `FILE_STORAGE_PATH/quarantine/{projectId}`.
- Audit logs are written for quarantine events (`evidence.quarantined`).

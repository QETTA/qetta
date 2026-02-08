# Accounting Migration MVP — Qetta

## Why this is needed
- Accounting firms often require continuity with their existing DOCX templates; preserving and reusing these templates reduces onboarding friction and customer resistance.
- Qetta's product identity is document automation (DOCX/PDF/XLSX generation) and reducing rework/return rates is a core KPI.

## MVP Scope
- Import DOCX templates (store + versioning)
- Detect placeholders (handlebars-style `{{var}}`) and store placeholder list
- Render DOCX templates with provided JSON data (returns DOCX file path)
- Minimal validation rules engine shell to generate QA checklist (P0: required fields, sums, date ranges)
- Expose API endpoints and a minimal admin UI (upload/list/render)

## Data Model (Mongo)
- `templates` collection
  - `_id, firm_id, name, description, current_version, versions[], placeholders[], created_at, updated_at`
- `template_version` (embedded)
  - `version, file_path, file_type, created_at`

## API
- POST `/api/qetta/v1/templates/import` — multipart form `file`, `name`, `description`, optional `project_id` (returns `id`, `placeholders`)
- GET `/api/qetta/v1/templates` — list templates
- GET `/api/qetta/v1/templates/:id/download` — download current docx
- POST `/api/qetta/v1/templates/:id/render` — JSON `data` body returns rendered docx path

## UI Flow
- Admin page: Templates
  - Upload template (name, description, file)
  - See detected placeholders
  - Click template → Render (enter JSON or map fields via UI) → Download result

## Validation rules
- A modular ruleset will evaluate required fields, sums, date ranges, and signature/attachment presence and return QA checklist items.

## Migration strategy
- Import existing templates as-is, detect placeholders without altering template XML, and preserve original in `storage/templates/{id}/v1_...`.
- HWP/HWPX: store-only in MVP (flagged as unsupported for auto-render); include a later converter service (libreoffice/unoconv or external service).

## Security & Operations
- File validation (magic-byte and extension) enforced
- File size limits from `MAX_EVIDENCE_SIZE_MB`
- Virus scanning recommended (ClamAV) — implement as upload hook
- Store originals encrypted if PII included

## Tests
- Unit tests for placeholder detection and render workflow
- Add e2e tests for upload → render → download

## Open Questions / Assumptions
- PDF generation: deferred to next iteration (DOCX → HTML → PDF via Puppeteer or libreoffice)
- Templating syntax: handlebars-style `{{var}}` (docxtemplater compatible)

---

Created by automated agent scaffold; please review and expand QA rule details and UI wireframes for next sprint.

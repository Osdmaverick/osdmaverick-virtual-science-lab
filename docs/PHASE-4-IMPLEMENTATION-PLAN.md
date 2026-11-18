# Phase 4 — Cloud lab notebook synchronisation

## Starting point

This phase is developed on `feature/phase-4-cloud-notebook-sync-v2`, branched directly from the verified Phase 3 assignments foundation. It must not inherit the older prototype branch `feature/phase-4-cloud-notebook-sync`, whose schema and client implementation predate the reconciled Phase 1–3 migrations.

Dependencies:
- Phase 1: authenticated profiles and trusted teacher provisioning.
- Phase 2: teacher-owned classes, invite codes and student enrolments.
- Phase 3: assignments, submissions and database-enforced teacher/student boundaries.

## User outcomes

### Students
- Continue creating and editing notebook reports when signed out or offline.
- Back up reports to a class in which they are enrolled.
- Restore their own reports on another signed-in device.
- See teacher rubric feedback attached to their own reports.
- Export a portable JSON backup at any time.

### Teachers
- Load notebook reports only from classes they own.
- Review reports and publish rubric scores and written feedback.
- Reopen the dashboard and see previously saved assessments.

### Non-goals
- No real-time collaborative editing in this phase.
- No public sharing links.
- No remote code execution or arbitrary file uploads.
- No automatic deletion of local work after a cloud operation.
- No hosted Supabase connection or remote migration until explicitly approved.

## Data model proposal

1. `lab_reports`
   - UUID primary key.
   - Student owner and enrolled class foreign keys.
   - Stable client-generated report identifier, unique per student and class.
   - Validated JSONB report payload and created/updated timestamps.
   - Optional revision/version metadata for conflict detection.

2. `lab_report_assessments`
   - One current assessment per report for the initial release.
   - Teacher identity, rubric scores, written feedback and timestamps.
   - Teacher identity and class ownership validated in the database, not trusted from the browser.

Prefer a structured, size-limited report payload. Validate required fields, string lengths and JSON object shape at the database boundary. Do not store authentication secrets or unnecessary personal data in reports.

## Security requirements

- Enable RLS on every new table.
- Students can read only their own reports in enrolled classes; report writes go through a revision-checked RPC, and direct delete is denied so an assessed report cannot be erased with its feedback.
- Teachers can read reports only for classes they own.
- Only the owning class teacher can create or update an assessment for a report in that class.
- Students can read assessments only for their own reports; they cannot insert, update or delete assessments.
- Browser-supplied student IDs, teacher IDs, role values and grading identities are never trusted.
- Use explicit column grants and narrowly scoped database functions where needed; avoid broad table grants that let clients set ownership or grading metadata.
- Add database tests for cross-class access, forged identities, non-enrolled students, other teachers, assessment tampering and class membership changes.
- Keep the Supabase secret/service-role key out of all browser assets and repository files.

## Synchronisation behaviour

- Local browser storage remains the offline source of unsynced work.
- Each report has a stable client ID and an updated timestamp.
- Sync is an explicit user action initially; report which items succeeded or failed.
- Use a stable owner/class/client-report key with a transaction-scoped advisory lock and optimistic revision checks to make retries safe and detect concurrent writes.
- Do not silently overwrite newer cloud work. Compare revision or updated-at metadata and present a clear conflict choice (keep local, keep cloud, or inspect both) before replacing either copy.
- Restore merges by stable report ID and never deletes local-only reports.
- A failed request leaves the local copy intact and displays an actionable error.
- Show last successful sync time and per-report sync state.

## Implementation sequence

1. Inspect and adapt the existing local notebook report schema and teacher rubric workflow without breaking local save, print or JSON export.
2. Add the cloud tables, constraints, indexes, RLS policies, grants and any narrowly scoped RPCs as a new migration after Phase 3.
3. Add pgTAP tests for all ownership, enrolment, class-teacher and assessment boundaries.
4. Add an isolated sync module with safe DOM rendering, idempotent writes, restore/merge and conflict handling.
5. Add student and teacher sync UI with explicit status, retry and local-backup messaging.
6. Add static smoke tests and desktop/mobile browser QA, including unconfigured Supabase mode.
7. Run a clean local Supabase migration reset and all Phase 1–4 database tests.
8. Manually inspect screenshots and review the complete diff before proposing an isolated development review.

## Acceptance criteria

- Existing notebook functionality works with Supabase unconfigured.
- Student A cannot read or modify Student B's reports; students cannot directly delete cloud reports.
- A student cannot sync into a class they have not joined.
- Teacher A cannot load reports or assessments from Teacher B's classes.
- Students cannot create or change rubric scores or feedback.
- A student can restore their own report and teacher feedback on a second browser context.
- Repeated syncs do not create duplicate reports.
- Conflicting local/cloud edits are detected and not silently discarded.
- Desktop and mobile layouts pass browser QA without horizontal overflow.
- All Phase 1–4 migrations pass from a clean local database.

## Implementation and verification status

- [x] Student notebook page supports local create/edit, browser persistence, JSON export/import and explicit cloud sync/restore.
- [x] Teacher review interface supports four-part rubric scoring and written feedback for reports in teacher-owned classes.
- [x] Cloud migration validates the five-field report schema, caps payload size, enforces class enrolment, uses revision checks and serializes concurrent sync attempts.
- [x] Assessment writes are restricted to the owning class teacher; students can read feedback only on their own reports.
- [x] Database security suite passed on a clean local Supabase database with 23 pgTAP assertions ([run #44385686504](https://github.com/Osdmaverick/osdmaverick-virtual-science-lab/actions/runs/44385686504)).
- [x] Static checks and desktop/mobile browser QA passed, including local create/edit/export, reload persistence, responsive layout and navigation ([run #44396304795](https://github.com/Osdmaverick/osdmaverick-virtual-science-lab/actions/runs/44396304795)).
- [x] Cloud restore now asks before replacing a newer local report; cancel preserves local work and local-only reports remain untouched.
- [x] Imported and persisted local reports are checked against the exact five-field database schema and field length limits; invalid backup entries are skipped and counted.
- [x] Inspect the uploaded desktop/mobile previews; the notebook form and report cards remain readable at both widths. Adjusted screenshot capture to start at the top of the page.
- [x] Harden persisted and restored teacher assessments: validate the four rubric scores and feedback before rendering, and safely discard malformed legacy assessment metadata.
- [x] Add regression coverage for malformed locally stored assessments; static checks and desktop/mobile notebook browser QA passed.
- [x] Final clean-database migration and database permission/RLS suite passed ([run #44401478956](https://github.com/Osdmaverick/osdmaverick-virtual-science-lab/actions/runs/44401478956)).
- [x] Final repository-wide, public-release, assignments and notebook desktop/mobile QA passed ([run #44401478829](https://github.com/Osdmaverick/osdmaverick-virtual-science-lab/actions/runs/44401478829)).
- [x] Final source review completed: 10 expected changed files only; no Supabase secret/service-role key patterns found; local and cloud restore paths validate assessment data.

## Release boundary

This branch is isolated from `main` and the production GitHub Pages site. Use local CI only. Do not merge, deploy, connect the hosted Supabase project, or apply remote migrations without explicit user approval.

Before any hosted connection, the previously exposed Supabase secret key must be revoked and replaced. Only the browser-safe publishable key may be used by the client.

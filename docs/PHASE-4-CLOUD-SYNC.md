# Phase 4 — Cloud notebook and assessment synchronisation

## Scope
Phase 4 connects the existing student lab notebook and teacher rubric dashboard to the Supabase account and class system without removing their browser-local backup workflows.

- Students can sync their local notebook reports to a class they are enrolled in.
- Students can restore their cloud reports on another signed-in device.
- Teachers can load reports submitted by students in classes they own.
- Teachers can sync rubric scores and feedback to the student's account.
- Existing local storage, JSON import/export and CSV export remain available as offline/backup paths.

## Migration order
Apply these migrations in order:
1. `202611050001_profiles.sql`
2. `202611050002_classes.sql`
3. `202611050003_assignments.sql`
4. `202611060001_lab_notebook_sync.sql`

## Security model
- A student can insert, update, delete and read only their own lab reports, and only for a class in which they are enrolled.
- A teacher can read lab reports only for classes they own.
- A teacher can create or update assessments only for reports in classes they own.
- A student can read assessments attached to their own reports.
- Browser users cannot set another student's identity; the report policy checks `auth.uid()`.
- The client uses only the Supabase publishable key. Never put a service-role key in browser code.

## Setup and verification
1. Configure `assets/supabase-config.js` with the project URL and publishable key.
2. Apply all four migrations in order.
3. Sign in as a student, join a class, save a notebook report, then use **Sync notebook to cloud**.
4. Sign in as the owning teacher, open the Teacher Assessment Dashboard, select **Load cloud class reports**, and review a student's report.
5. Save rubric scores and feedback, then select **Sync saved grades to cloud**.
6. Sign in as the student and verify that the teacher's feedback is visible after restoring/reloading the report workflow.

Automated static/browser checks validate the unconfigured setup and local notebook/teacher flows. They do not replace live Supabase RLS testing with separate teacher and student accounts.

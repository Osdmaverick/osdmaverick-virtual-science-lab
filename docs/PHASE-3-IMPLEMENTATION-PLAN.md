# Phase 3 — Assignments and grading implementation plan

## Starting point

This phase is isolated from production and branches from the verified Phase 2 foundation. It depends on:

- Phase 1 identity: profiles, student-default registration, trusted teacher provisioning.
- Phase 2 classes: teacher-owned classes, private invite codes, enrolments and roster access.

The Phase 2 database and UI checks passed on commit `f6ef8e7d22a04629c2de490308ba0a7af5538189`.

## User-facing outcomes

### Teachers
- Create and edit assignments only in classes they own.
- Save drafts, publish, archive and delete assignments.
- Set title, instructions, optional due date and points available.
- View submissions from enrolled students in their own classes.
- Grade submissions and provide written feedback.

### Students
- See published assignments only in classes they have joined.
- Save a draft response and submit their work.
- See their own submission status, score and teacher feedback.
- Never read or alter another student's submission or grading data.

## Data model

1. `assignments`: class, teacher, title, description, instructions, due date, points, lifecycle status and timestamps.
2. `assignment_submissions`: assignment, student, response, draft/submitted status, submission timestamp, score, feedback and grader metadata.

Enforce one submission per student per assignment. Use foreign keys and cascading cleanup when a class or assignment is deleted.

## Mandatory authorization rules

- RLS is enabled on both tables.
- Only the owning class teacher may create or manage an assignment.
- Students can select only published assignments in classes where they are enrolled.
- Students can insert or update only their own submission for a published assignment.
- Student database grants exclude score, feedback, grader identity and grading timestamps.
- Only the owning class teacher may write grading fields.
- Scores must be between zero and the assignment's points possible.
- Students cannot alter another student's work.
- Non-enrolled students cannot read or submit work for the class.
- Do not rely on hidden UI controls for authorization; enforce all rules in PostgreSQL.

## Implementation status

- [x] Reconciled the schema with the current Phase 1 and Phase 2 migrations.
- [x] Added the Phase 3 assignments and submissions migration.
- [x] Added pgTAP coverage for two teachers and two students, including draft visibility, enrolment boundaries, submission ownership, grading permissions, score limits and post-grade locking.
- [x] Added the assignments page and teacher/student browser workflows.
- [x] Added safe DOM rendering and UI smoke checks.
- [x] Complete a passing clean-database CI run for migrations 1–3 and all security tests (34 pgTAP assertions; [run #43838321594](https://github.com/Osdmaverick/osdmaverick-virtual-science-lab/actions/runs/43838321594)).
- [x] Complete desktop/mobile browser smoke and accessibility-oriented checks for landmarks, labels, navigation, responsive layout and horizontal overflow ([run #43838321498](https://github.com/Osdmaverick/osdmaverick-virtual-science-lab/actions/runs/43838321498)).
- [ ] Prepare an isolated development review; no production merge or deployment is authorized.

## Implementation details

- Grading uses a narrowly scoped SECURITY DEFINER function named grade_assignment_submission. Browser users do not receive direct UPDATE permission on score or feedback columns; the function verifies teacher role, class ownership, submission status and score limits.
- Student assignment visibility is limited to published assignments in enrolled classes. Student submission rows are restricted to their own account.
- Database triggers set submission timestamps and grader metadata, preserve grading fields against student writes, lock graded work and prevent reducing points below an existing score.
- The browser UI supports teacher draft creation, publish/archive/delete, class-scoped submission review and grading; students can save drafts, submit work and view their own feedback.
- This branch remains isolated from main and the live GitHub Pages site.
- The latest clean CI run applied the Phase 1–3 migrations to a fresh local Supabase database and passed the assignment pgTAP suite. The browser workflow passed desktop and mobile checks and uploaded visual previews (`phase3-visual-previews`, artifact ID `14211348510`).
- Manual preview review confirmed the assignments page keeps its responsive layout at desktop and mobile widths. The prominent “not connected” message is expected while hosted Supabase configuration is intentionally absent; authenticated assignment workflows are not live yet.

## Release boundary

No hosted Supabase project is linked or mutated by this work. Use local CI only. Do not merge, deploy, apply remote migrations or expose real student data without explicit approval.

## Known prototype review items

The earlier prototype is a starting reference, not approved production code. Its SQL and browser behavior must be reconciled with the current Phase 2 schema and re-tested. In particular, verify that student submission writes cannot include grading fields, that teacher grading is class-scoped, and that assignment lifecycle changes do not leak drafts to students.

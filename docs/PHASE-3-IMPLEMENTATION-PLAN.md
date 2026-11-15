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

## Implementation order

1. Review and adapt the existing assignments prototype to the Phase 1/2 migration names and APIs.
2. Write a new timestamped Phase 3 migration on this branch.
3. Add pgTAP tests using separate synthetic teacher and student accounts, including two teachers and two students.
4. Test draft visibility, publication, enrolment boundaries, submission ownership, grading-field restrictions, score limits and graded-work behavior.
5. Add browser smoke tests and validate safe DOM rendering.
6. Add the assignments page and teacher/student workflows.
7. Run the full clean-database workflow from migrations 1–3.
8. Review desktop/mobile behavior and accessibility before requesting a release review.

## Release boundary

No hosted Supabase project is linked or mutated by this work. Use local CI only. Do not merge, deploy, apply remote migrations or expose real student data without explicit approval.

## Known prototype review items

The earlier prototype is a starting reference, not approved production code. Its SQL and browser behavior must be reconciled with the current Phase 2 schema and re-tested. In particular, verify that student submission writes cannot include grading fields, that teacher grading is class-scoped, and that assignment lifecycle changes do not leak drafts to students.

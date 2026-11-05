# Phase 3 — Assignments and learning activities

## Scope

This phase introduces the secure database foundation for teacher-created assignments and student work.

- Teachers can create, edit, publish, archive and delete assignments in classes they own.
- Assignments support a title, description, instructions, due date and points available.
- Enrolled students can read published assignments only.
- Students can save draft responses and submit work for published assignments.
- Students can read and update only their own ungraded submissions.
- Teachers can read submissions for their own classes and record scores and feedback.
- Database Row Level Security and column-level grants protect learner work and grading fields.

## Apply migrations in order

1. `supabase/migrations/202611050001_profiles.sql` — Phase 1.
2. `supabase/migrations/202611050002_classes.sql` — Phase 2.
3. `supabase/migrations/202611050003_assignments.sql` — Phase 3.

Do not apply Phase 3 before Phase 1 and Phase 2.

## Data model

- `assignments`: teacher-owned activity attached to a class, with draft/published/archived lifecycle.
- `assignment_submissions`: one response per student per assignment, with draft/submitted state, score and feedback.

Student browser permissions do not include score, feedback, grader identity or grading timestamps. Teachers receive separate column-level update permission for grading fields. Students cannot change a submission after it has been graded.

## Verification boundary

Automated repository checks can validate file structure and SQL security markers, but they do not execute PostgreSQL policies. Live verification requires the owner-created Supabase project and the migrations applied in order.

Use separate teacher and student test accounts to verify:
- a teacher can create and publish an assignment only in their own class;
- another teacher cannot read or change it;
- enrolled students see published assignments but not drafts or archived items;
- a non-enrolled student cannot read or submit to the class assignment;
- students can save and submit their own response but cannot read or modify another student's work;
- students cannot change scores or feedback;
- the class teacher can grade work, with scores bounded by points available;
- graded work becomes read-only to the student.

## Not included yet

This migration does not add assignment attachments, quiz authoring, automated marking, announcements, attendance, or cloud migration of the existing lab notebook. Those should be separate scoped changes with their own permissions and QA.

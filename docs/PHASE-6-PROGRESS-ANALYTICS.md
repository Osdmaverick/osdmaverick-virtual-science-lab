# Phase 6 — Learning progress analytics

## Features
- One role-aware progress page for students and teachers.
- Students see only their own quiz attempts, graded assignment results and lab-report rubric feedback.
- Teachers see class-level learner summaries across quiz attempts, graded assignments and assessed lab reports, with a class filter.
- Recent activity feed and manual refresh.
- Averages exclude ungraded work rather than treating it as zero.
- Uses existing Phase 2–5 tables and row-level security. No new database migration is required.

## Data and permissions
The page reads `classes`, `enrollments`, `assignments`, `assignment_submissions`, `quiz_attempts`, `lab_reports`, and related assessment/profile records. Queries are scoped to the signed-in teacher's classes or the signed-in student's own records. Existing RLS policies are relied on as the access-control boundary; the UI is not treated as a security boundary.

## Setup and validation
Apply the existing migrations in order through Phase 5, configure `assets/supabase-config.js`, then test with separate teacher and student accounts. Live privacy/RLS checks require a configured Supabase project. Analytics are descriptive and formative, not automated high-stakes grading or predictive student profiling.

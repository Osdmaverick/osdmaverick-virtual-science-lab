# Phase 8 — Student learning experience

## Features
- Student learning area for published lessons, practical activities and resources across enrolled classes.
- Class filter, learning overview, activity details, objectives, materials, procedures and safety notes.
- Students can start an activity, mark it complete, or return it to in-progress.
- Progress is saved per student and content item.
- Teachers can read completion records for their own classes; students can read and update only their own records.

## Setup
1. Apply Phase 1–8 migrations in order.
2. Configure `assets/supabase-config.js` with the Supabase Project URL and publishable key.
3. Sign in with a teacher account and publish lessons/practicals/resources in the content studio.
4. Sign in with a student account enrolled in that class and open `learning.html`.
5. Open an activity, mark it in progress/completed, reload and verify the state persists.
6. Sign in as the owning teacher and inspect completion data through the learning progress dashboard.

## Security
- The new `student_content_progress` table has Row Level Security enabled.
- Students can create/update their own progress only for published learning content in classes they are enrolled in.
- Teachers have read-only access to progress rows in classes they own.
- The learning UI is not a security boundary; database policies enforce access.
- Live RLS behaviour requires a configured Supabase project and separate teacher/student accounts.

## Scope
- Completion is a learner self-report, not a graded assessment.
- No time-on-task surveillance, predictive scoring or high-stakes grading is added.

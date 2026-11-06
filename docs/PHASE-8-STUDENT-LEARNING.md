# Phase 8 — Student learning experience

## Features
- Student-only learning workspace for published lessons, practical activities and resource links in enrolled classes.
- Search by title, topic and summary; filter by class and content type.
- Structured lesson reading with learning objectives and explanatory content.
- Practical activity view with materials, ordered procedure steps and safety notes.
- Student progress states: not started, in progress and completed.
- Per-student completion totals and remaining-item counts.
- Teachers can read progress records for their own classes; students manage only their own progress.

## Database
Apply migrations 1–8 in order. Phase 8 adds `public.student_content_progress` and a composite class/content foreign key.
- A student can record progress only for published lesson, practical or resource items in a class they have joined.
- Students cannot alter their student ID, class ID or content item ID after inserting a progress row.
- Teachers can read progress only in classes they own.
- Anonymous access is revoked; authenticated grants are restricted to required columns.
- Row Level Security is the access-control boundary.

## Setup and verification
1. Apply the Phase 1–8 SQL migrations in order.
2. Configure `assets/supabase-config.js` with the Supabase project URL and publishable key.
3. Sign in as a teacher, publish a lesson or practical in a class.
4. Sign in as an enrolled student, open the My Learning page and complete the item.
5. Verify the student sees the completion state and the teacher can read the class progress records.
6. Verify another student's progress is not visible to the first student.

## Limitations
- Progress is tracked per published content item; it is not an examination score or mastery prediction.
- This phase does not add file uploads, offline sync or teacher grading of lesson completion.
- Live RLS behaviour requires a configured Supabase project and separate teacher/student accounts.
